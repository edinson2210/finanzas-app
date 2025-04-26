"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Edit, Plus, Trash, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useFinance } from "@/context/finance-context";
import { Debt, Transaction } from "@/context/finance-context";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DebtsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const {
    state,
    addDebt,
    updateDebt,
    deleteDebt,
    addDebtPayment,
    getDebtTransactions,
    getDebtTotalPaid,
  } = useFinance();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [transactionsDialogOpen, setTransactionsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    totalAmount: "",
    remainingAmount: "",
    monthlyPayment: "",
    nextPaymentDate: new Date().toISOString(),
    frequency: "monthly" as Debt["frequency"],
    creditor: "",
    interestRate: "",
    interestFrequency: "monthly" as Debt["interestFrequency"],
  });
  const [paymentData, setPaymentData] = useState({
    amount: "",
    date: new Date().toISOString(),
    notes: "",
  });
  const [relatedTransactions, setRelatedTransactions] = useState<Transaction[]>(
    []
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<string | null>(null);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Cargar datos cuando el componente se monta
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      setIsLoading(false);
    } else {
      router.push("/login");
    }
  }, [status, router]);

  // Actualizar el formulario si estamos editando
  useEffect(() => {
    if (editing) {
      setFormData({
        description: editing.description,
        totalAmount: editing.totalAmount.toString(),
        remainingAmount: editing.remainingAmount.toString(),
        monthlyPayment: editing.monthlyPayment.toString(),
        nextPaymentDate: editing.nextPaymentDate,
        frequency: editing.frequency,
        creditor: editing.creditor || "",
        interestRate: editing.interestRate
          ? editing.interestRate.toString()
          : "",
        interestFrequency: editing.interestFrequency || "monthly",
      });
    } else {
      // Resetear el formulario
      setFormData({
        description: "",
        totalAmount: "",
        remainingAmount: "",
        monthlyPayment: "",
        nextPaymentDate: new Date().toISOString(),
        frequency: "monthly" as Debt["frequency"],
        creditor: "",
        interestRate: "",
        interestFrequency: "monthly" as Debt["interestFrequency"],
      });
    }
  }, [editing]);

  // Cargar transacciones relacionadas cuando cambia el ID de deuda seleccionado
  useEffect(() => {
    if (selectedDebtId) {
      const transactions = getDebtTransactions(selectedDebtId);
      setRelatedTransactions(transactions);
    }
  }, [selectedDebtId, getDebtTransactions]);

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const debtData = {
      description: formData.description,
      totalAmount: parseFloat(formData.totalAmount),
      remainingAmount: parseFloat(formData.remainingAmount),
      monthlyPayment: parseFloat(formData.monthlyPayment),
      nextPaymentDate: formData.nextPaymentDate,
      frequency: formData.frequency,
      creditor: formData.creditor,
      interestRate: formData.interestRate
        ? parseFloat(formData.interestRate)
        : undefined,
      interestFrequency: formData.interestFrequency,
    };

    try {
      if (editing) {
        await updateDebt(editing.id, debtData);
        toast({
          title: "Deuda actualizada",
          description: "La deuda ha sido actualizada correctamente",
        });
      } else {
        await addDebt(debtData);
        toast({
          title: "Deuda agregada",
          description: "La deuda ha sido agregada correctamente",
        });
      }
      setDialogOpen(false);
      setEditing(null);
    } catch (error) {
      console.error("Error al guardar deuda:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la deuda",
        variant: "destructive",
      });
    }
  };

  // Manejar la eliminación de una deuda
  const handleDelete = async () => {
    if (!debtToDelete) return;

    try {
      await deleteDebt(debtToDelete);
      setDebtToDelete(null);
      setDeleteDialogOpen(false);

      toast({
        title: "Deuda eliminada",
        description: "La deuda ha sido eliminada correctamente",
      });
    } catch (error) {
      console.error("Error al eliminar deuda:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la deuda",
        variant: "destructive",
      });
    }
  };

  // Abrir diálogo de eliminación de deuda
  const handleDeleteClick = (id: string) => {
    setDebtToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Función para manejar el pago de una deuda
  const handleMakePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDebtId) return;

    try {
      const amount = parseFloat(paymentData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Error",
          description: "Ingresa un monto válido",
          variant: "destructive",
        });
        return;
      }

      // Realizar el pago
      await addDebtPayment(
        selectedDebtId,
        amount,
        paymentData.date,
        paymentData.notes
      );

      // Limpiar el formulario y cerrar el diálogo
      setPaymentData({
        amount: "",
        date: new Date().toISOString(),
        notes: "",
      });
      setPaymentDialogOpen(false);

      toast({
        title: "Pago registrado",
        description: "El pago ha sido registrado correctamente",
      });
    } catch (error) {
      console.error("Error al registrar el pago:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar el pago",
        variant: "destructive",
      });
    }
  };

  // Abrir diálogo de pago
  const openPaymentDialog = (debtId: string) => {
    setSelectedDebtId(debtId);
    setPaymentDialogOpen(true);
  };

  // Abrir diálogo de transacciones relacionadas
  const openTransactionsDialog = (debtId: string) => {
    setSelectedDebtId(debtId);
    setTransactionsDialogOpen(true);
  };

  // Calcular estadísticas
  const totalDebt = state.debts.reduce((sum, d) => sum + d.totalAmount, 0);
  const totalRemaining = state.debts.reduce(
    (sum, d) => sum + d.remainingAmount,
    0
  );

  // Calcular el total de pagos mensuales considerando la frecuencia
  const totalMonthly = state.debts.reduce((sum, d) => {
    let monthlyPayment = d.monthlyPayment;

    // Ajustar según frecuencia
    switch (d.frequency) {
      case "daily":
        monthlyPayment = d.monthlyPayment * 30; // Aproximado mensual
        break;
      case "weekly":
        monthlyPayment = d.monthlyPayment * 4.33; // Semanas promedio en un mes
        break;
      case "biweekly":
        monthlyPayment = d.monthlyPayment * 2; // Dos veces al mes
        break;
      case "quarterly":
        monthlyPayment = d.monthlyPayment / 3; // Un tercio por mes
        break;
      case "yearly":
        monthlyPayment = d.monthlyPayment / 12; // Un doceavo por mes
        break;
      // Para 'monthly' se mantiene el valor original
    }

    return sum + monthlyPayment;
  }, 0);

  const debtPaid =
    totalDebt > 0 ? ((totalDebt - totalRemaining) / totalDebt) * 100 : 0;

  // Si está cargando o no está autenticado, mostrar estado de carga
  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Deudas</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Nueva Deuda
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Deuda Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalDebt.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {state.debts.length} deudas activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Deuda Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalRemaining.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {debtPaid.toFixed(1)}% pagado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Pago Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMonthly.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total de pagos (ajustado a valor mensual)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Tiempo Restante (Aprox.)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalMonthly > 0
                ? Math.ceil(totalRemaining / totalMonthly)
                : "-"}{" "}
              meses
            </div>
            <p className="text-xs text-muted-foreground">
              Estimado para liquidar deudas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Listado de deudas */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Historial de Deudas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Lista de todas tus deudas</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Descripción</TableHead>
                <TableHead className="hidden md:table-cell">
                  Monto Total
                </TableHead>
                <TableHead>Pendiente</TableHead>
                <TableHead className="hidden md:table-cell">Cuota</TableHead>
                <TableHead>Interés</TableHead>
                <TableHead className="hidden md:table-cell">
                  Próximo Pago
                </TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.debts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No has registrado ninguna deuda.
                  </TableCell>
                </TableRow>
              ) : (
                state.debts.map((debt) => {
                  const percentPaid =
                    debt.totalAmount > 0
                      ? ((debt.totalAmount - debt.remainingAmount) /
                          debt.totalAmount) *
                        100
                      : 0;
                  const formatDate = (dateString: string) => {
                    const date = new Date(dateString);
                    return new Intl.DateTimeFormat("es", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    }).format(date);
                  };

                  // Calcular interés mensual si existe tasa de interés
                  const interestAmount =
                    debt.interestRate && debt.interestRate > 0
                      ? debt.remainingAmount *
                        getInterestRateForPeriod(
                          debt.interestRate,
                          debt.interestFrequency
                        )
                      : 0;

                  // Obtener texto de la frecuencia
                  const getFrequencyText = (frequency?: string) => {
                    switch (frequency) {
                      case "weekly":
                        return "semanal";
                      case "biweekly":
                        return "quincenal";
                      case "monthly":
                        return "mensual";
                      case "quarterly":
                        return "trimestral";
                      case "yearly":
                        return "anual";
                      default:
                        return "mensual";
                    }
                  };

                  // Función para calcular tasa de interés según frecuencia
                  function getInterestRateForPeriod(
                    rate: number,
                    frequency?: string
                  ) {
                    switch (frequency) {
                      case "weekly":
                        return rate / 100;
                      case "biweekly":
                        return rate / 100;
                      case "monthly":
                        return rate / 100;
                      case "quarterly":
                        return rate / 100;
                      case "yearly":
                        return rate / 100 / 12;
                      default:
                        return rate / 100 / 12;
                    }
                  }

                  return (
                    <TableRow key={debt.id}>
                      <TableCell className="font-medium">
                        {debt.description}
                        {debt.creditor && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Acreedor: {debt.creditor}
                          </div>
                        )}
                        <div className="md:hidden mt-1 text-xs">
                          <div>Total: ${debt.totalAmount.toLocaleString()}</div>
                          <div>
                            Cuota: ${debt.monthlyPayment.toLocaleString()}
                            {debt.frequency && debt.frequency !== "monthly" && (
                              <span className="text-muted-foreground ml-1">
                                ({getFrequencyText(debt.frequency)})
                              </span>
                            )}
                          </div>
                          <div>Próximo: {formatDate(debt.nextPaymentDate)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        $
                        {debt.totalAmount.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        $
                        {debt.remainingAmount.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        $
                        {debt.monthlyPayment.toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        {debt.frequency && debt.frequency !== "monthly" && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({getFrequencyText(debt.frequency)})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {debt.interestRate ? (
                          <div>
                            {debt.interestRate}%{" "}
                            {getFrequencyText(debt.interestFrequency)}
                            {interestAmount > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                ~$
                                {interestAmount.toLocaleString("es-ES", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatDate(debt.nextPaymentDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 min-w-[120px]">
                          <div className="flex justify-between text-xs">
                            <span>{percentPaid.toFixed(0)}%</span>
                            <span className="hidden md:inline">
                              $
                              {(
                                debt.totalAmount - debt.remainingAmount
                              ).toFixed(2)}{" "}
                              / ${debt.totalAmount.toFixed(2)}
                            </span>
                          </div>
                          <Progress value={percentPaid} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPaymentDialog(debt.id)}
                          >
                            <PlusCircle className="h-3.5 w-3.5 mr-1" />
                            <span className="hidden sm:inline">Pago</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditing(debt);
                              setFormData({
                                description: debt.description,
                                totalAmount: debt.totalAmount.toString(),
                                remainingAmount:
                                  debt.remainingAmount.toString(),
                                monthlyPayment: debt.monthlyPayment.toString(),
                                nextPaymentDate: debt.nextPaymentDate,
                                frequency: debt.frequency,
                                creditor: debt.creditor || "",
                                interestRate: debt.interestRate
                                  ? debt.interestRate.toString()
                                  : "",
                                interestFrequency:
                                  debt.interestFrequency || "monthly",
                              });
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteClick(debt.id)}
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo para añadir/editar deuda */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Deuda" : "Añadir Nueva Deuda"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Actualiza los detalles de tu deuda aquí."
                : "Completa los detalles para añadir una nueva deuda."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Ej: Préstamo personal"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="totalAmount">Monto Total</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, totalAmount: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="remainingAmount">Monto Pendiente</Label>
                <Input
                  id="remainingAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.remainingAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      remainingAmount: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="monthlyPayment">Monto de Pago</Label>
                <Input
                  id="monthlyPayment"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.monthlyPayment}
                  onChange={(e) =>
                    setFormData({ ...formData, monthlyPayment: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="frequency">Frecuencia de Pago</Label>
                <Select
                  value={formData.frequency || "monthly"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      frequency: value as Debt["frequency"],
                    })
                  }
                >
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="Selecciona una frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diario</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quincenal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nextPaymentDate">Fecha del Próximo Pago</Label>
                <Input
                  id="nextPaymentDate"
                  type="date"
                  value={formData.nextPaymentDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nextPaymentDate: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="creditor">Deudor</Label>
                <Input
                  id="creditor"
                  value={formData.creditor}
                  onChange={(e) =>
                    setFormData({ ...formData, creditor: e.target.value })
                  }
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="interestRate">Tasa de Interés (%)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.interestRate}
                  onChange={(e) =>
                    setFormData({ ...formData, interestRate: e.target.value })
                  }
                  placeholder="Ej: 15 para 15%"
                />
                <p className="text-sm text-muted-foreground">
                  Ingresa la tasa de interés (sin el símbolo %). La frecuencia
                  se define abajo.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="interestFrequency">Frecuencia de Interés</Label>
                <Select
                  value={formData.interestFrequency || "monthly"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      interestFrequency: value as Debt["interestFrequency"],
                    })
                  }
                >
                  <SelectTrigger id="interestFrequency">
                    <SelectValue placeholder="Selecciona una frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quincenal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Especifica si la tasa se aplica mensual, quincenal, etc.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {editing ? "Actualizar" : "Añadir"} Deuda
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de registro de pago */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar pago de deuda</DialogTitle>
            <DialogDescription>
              Registra un pago para esta deuda y actualiza su saldo pendiente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMakePayment}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payment-amount" className="text-right">
                  Monto
                </Label>
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="col-span-3"
                  value={paymentData.amount}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, amount: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payment-date" className="text-right">
                  Fecha
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {paymentData.date
                          ? format(new Date(paymentData.date), "PPP", {
                              locale: es,
                            })
                          : "Selecciona una fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={new Date(paymentData.date)}
                        onSelect={(date) =>
                          setPaymentData({
                            ...paymentData,
                            date:
                              date?.toISOString() || new Date().toISOString(),
                          })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payment-notes" className="text-right">
                  Notas
                </Label>
                <Textarea
                  id="payment-notes"
                  placeholder="Detalles del pago..."
                  className="col-span-3"
                  value={paymentData.notes}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, notes: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Registrar pago</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de transacciones relacionadas */}
      <Dialog
        open={transactionsDialogOpen}
        onOpenChange={setTransactionsDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transacciones de la Deuda</DialogTitle>
            <DialogDescription>
              Historial de pagos y transacciones relacionadas con esta deuda.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {relatedTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay transacciones relacionadas con esta deuda
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(new Date(transaction.date), "dd MMM yyyy", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>
                  Total pagado: $
                  {selectedDebtId
                    ? getDebtTotalPaid(selectedDebtId).toFixed(2)
                    : "0.00"}
                </TableCaption>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTransactionsDialogOpen(false)}
            >
              Cerrar
            </Button>
            <Button
              onClick={() => {
                setTransactionsDialogOpen(false);
                if (selectedDebtId) openPaymentDialog(selectedDebtId);
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Nuevo pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar deuda */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la deuda permanentemente y no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDebtToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
