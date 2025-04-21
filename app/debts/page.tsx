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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import { useFinance } from "@/context/finance-context";
import { Debt } from "@/context/finance-context";
import { cn } from "@/lib/utils";

export default function DebtsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { state, addDebt, updateDebt, deleteDebt } = useFinance();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);

  // Estado para el nuevo formulario de deuda
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [nextPaymentDate, setNextPaymentDate] = useState("");

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
      setDescription(editing.description);
      setTotalAmount(editing.totalAmount);
      setRemainingAmount(editing.remainingAmount);
      setMonthlyPayment(editing.monthlyPayment);
      setNextPaymentDate(
        format(new Date(editing.nextPaymentDate), "yyyy-MM-dd")
      );
    } else {
      // Resetear el formulario
      setDescription("");
      setTotalAmount(0);
      setRemainingAmount(0);
      setMonthlyPayment(0);
      setNextPaymentDate(format(new Date(), "yyyy-MM-dd"));
    }
  }, [editing]);

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const debtData = {
      description,
      totalAmount,
      remainingAmount,
      monthlyPayment,
      nextPaymentDate: new Date(nextPaymentDate),
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
  const handleDelete = async (id: string) => {
    try {
      await deleteDebt(id);
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

  // Calcular estadísticas
  const totalDebt = state.debts.reduce(
    (sum, debt) => sum + debt.totalAmount,
    0
  );
  const totalRemaining = state.debts.reduce(
    (sum, debt) => sum + debt.remainingAmount,
    0
  );
  const totalMonthly = state.debts.reduce(
    (sum, debt) => sum + debt.monthlyPayment,
    0
  );
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
              Total de pagos mensuales
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
                <TableHead>Descripción</TableHead>
                <TableHead>Monto Total</TableHead>
                <TableHead>Pendiente</TableHead>
                <TableHead>Pago Mensual</TableHead>
                <TableHead>Próximo Pago</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.debts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No hay deudas registradas.
                    <Button
                      variant="link"
                      className="ml-2"
                      onClick={() => {
                        setEditing(null);
                        setDialogOpen(true);
                      }}
                    >
                      Añadir una
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                state.debts.map((debt) => {
                  const percentPaid =
                    ((debt.totalAmount - debt.remainingAmount) /
                      debt.totalAmount) *
                    100;

                  return (
                    <TableRow key={debt.id}>
                      <TableCell className="font-medium">
                        {debt.description}
                      </TableCell>
                      <TableCell>${debt.totalAmount.toFixed(2)}</TableCell>
                      <TableCell className="font-bold text-red-600">
                        ${debt.remainingAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>${debt.monthlyPayment.toFixed(2)}</TableCell>
                      <TableCell>
                        {format(new Date(debt.nextPaymentDate), "dd MMM yyyy", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell className="w-32">
                        <div className="flex flex-col gap-1">
                          <Progress
                            value={percentPaid}
                            className={cn(
                              "h-2",
                              percentPaid > 80
                                ? "bg-green-200 [&>div]:bg-green-500"
                                : "bg-slate-200"
                            )}
                          />
                          <span className="text-xs text-muted-foreground">
                            {percentPaid.toFixed(0)}% pagado
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditing(debt);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(debt.id)}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
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
        <DialogContent className="sm:max-w-[425px]">
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(parseFloat(e.target.value))}
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
                  value={remainingAmount}
                  onChange={(e) =>
                    setRemainingAmount(parseFloat(e.target.value))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="monthlyPayment">Pago Mensual</Label>
                <Input
                  id="monthlyPayment"
                  type="number"
                  min="0"
                  step="0.01"
                  value={monthlyPayment}
                  onChange={(e) =>
                    setMonthlyPayment(parseFloat(e.target.value))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nextPaymentDate">Fecha del Próximo Pago</Label>
                <Input
                  id="nextPaymentDate"
                  type="date"
                  value={nextPaymentDate}
                  onChange={(e) => setNextPaymentDate(e.target.value)}
                  required
                />
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
    </div>
  );
}
