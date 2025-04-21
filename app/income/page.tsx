"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Edit, Plus, ArrowRight, Trash } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

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

import { useFinance } from "@/context/finance-context";
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
} from "@/components/ui/alert-dialog";

export default function IncomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { state, getIncomes, deleteTransaction } = useFinance();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(
    null
  );

  function getEditUrl(id: string, type: string) {
    return `/transactions/new?id=${id}&type=${type}`;
  }

  // Redirigir si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Cargar datos cuando el componente se monta
  useEffect(() => {
    const loadData = () => {
      try {
        // Usar los datos que ya están en el contexto, no llamar a fetchAllData
        setIsLoading(false);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      loadData();
    }
  }, [status]);

  // Manejar la eliminación de una transacción
  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!transactionToDelete) return;

    try {
      await deleteTransaction(transactionToDelete);
      toast({
        title: "Ingreso eliminado",
        description: "El ingreso ha sido eliminado correctamente",
      });
      setTransactionToDelete(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error al eliminar transacción:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el ingreso",
        variant: "destructive",
      });
    }
  };

  // Obtener todos los ingresos
  const allIncomes = getIncomes();

  // Filtrar ingresos fijos (recurrentes)
  const fixedIncomes = allIncomes.filter(
    (income) => income.recurrence && income.recurrence !== "none"
  );

  // Filtrar ingresos extra (no recurrentes)
  const extraIncomes = allIncomes.filter(
    (income) => !income.recurrence || income.recurrence === "none"
  );

  // Calcular totales
  const totalIncome = allIncomes.reduce(
    (sum, income) => sum + income.amount,
    0
  );
  const totalFixedIncome = fixedIncomes.reduce(
    (sum, income) => sum + income.amount,
    0
  );
  const totalExtraIncome = extraIncomes.reduce(
    (sum, income) => sum + income.amount,
    0
  );

  // Calcular media mensual (últimos 6 meses)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const recentIncomes = allIncomes.filter(
    (income) => new Date(income.date) >= sixMonthsAgo
  );

  const monthlyAverage =
    recentIncomes.length > 0
      ? recentIncomes.reduce((sum, income) => sum + income.amount, 0) / 6
      : 0;

  // Calcular cambios porcentuales (comparando con el mes anterior)
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const currentMonthIncomes = allIncomes.filter(
    (income) => new Date(income.date) >= oneMonthAgo
  );

  const previousMonthIncomes = allIncomes.filter(
    (income) =>
      new Date(income.date) >= twoMonthsAgo &&
      new Date(income.date) < oneMonthAgo
  );

  const currentMonthTotal = currentMonthIncomes.reduce(
    (sum, income) => sum + income.amount,
    0
  );
  const previousMonthTotal = previousMonthIncomes.reduce(
    (sum, income) => sum + income.amount,
    0
  );

  const percentageChange =
    previousMonthTotal > 0
      ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
      : 0;

  // Funciones para editar y eliminar transacciones

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
        <h1 className="text-3xl font-bold">Ingresos</h1>
        <Button asChild>
          <Link href="/transactions/new?type=income">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Ingreso
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <span
                className={cn(
                  percentageChange > 0
                    ? "text-green-500"
                    : percentageChange < 0
                    ? "text-red-500"
                    : ""
                )}
              >
                {percentageChange > 0 ? "+" : ""}
                {percentageChange.toFixed(1)}%
              </span>{" "}
              desde el mes pasado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Ingresos Fijos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalFixedIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((totalFixedIncome / totalIncome) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Ingresos Extra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalExtraIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((totalExtraIncome / totalIncome) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Media Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${monthlyAverage.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Basado en los últimos 6 meses
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="fixed">Fijos</TabsTrigger>
          <TabsTrigger value="extra">Extra</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Historial de Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>Lista de todos tus ingresos</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Recurrencia</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allIncomes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No hay ingresos registrados.
                        <Link
                          href="/transactions/new?type=income"
                          className="ml-2 text-blue-500 hover:underline"
                        >
                          Añadir uno
                        </Link>
                      </TableCell>
                    </TableRow>
                  ) : (
                    allIncomes.map((income) => (
                      <TableRow
                        key={income.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() =>
                          router.push(`/transactions/${income.id}`)
                        }
                      >
                        <TableCell className="font-medium cursor-pointer hover:text-blue-600">
                          {income.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{income.category}</Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(income.date), "dd MMM yyyy", {
                            locale: es,
                          })}
                        </TableCell>
                        <TableCell>
                          {income.recurrence && income.recurrence !== "none" ? (
                            <Badge>{income.recurrence}</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          ${income.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(getEditUrl(income.id, "income"));
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(income.id);
                              }}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fixed">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Ingresos Fijos (Recurrentes)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>Ingresos fijos o recurrentes</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Recurrencia</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fixedIncomes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No hay ingresos fijos registrados.
                        <Link
                          href="/transactions/new?type=income&recurrent=true"
                          className="ml-2 text-blue-500 hover:underline"
                        >
                          Añadir uno
                        </Link>
                      </TableCell>
                    </TableRow>
                  ) : (
                    fixedIncomes.map((income) => (
                      <TableRow
                        key={income.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() =>
                          router.push(`/transactions/${income.id}`)
                        }
                      >
                        <TableCell className="font-medium cursor-pointer hover:text-blue-600">
                          {income.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{income.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge>{income.recurrence}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          ${income.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(getEditUrl(income.id, "income"));
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(income.id);
                              }}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-4">
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="/transactions/new?type=income&recurrent=true">
                    <Plus className="mr-2 h-4 w-4" /> Añadir Ingreso Fijo
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extra">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Ingresos Extra (No Recurrentes)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>Ingresos extra o no recurrentes</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extraIncomes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No hay ingresos extra registrados.
                        <Link
                          href="/transactions/new?type=income"
                          className="ml-2 text-blue-500 hover:underline"
                        >
                          Añadir uno
                        </Link>
                      </TableCell>
                    </TableRow>
                  ) : (
                    extraIncomes.map((income) => (
                      <TableRow
                        key={income.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() =>
                          router.push(`/transactions/${income.id}`)
                        }
                      >
                        <TableCell className="font-medium cursor-pointer hover:text-blue-600">
                          {income.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{income.category}</Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(income.date), "dd MMM yyyy", {
                            locale: es,
                          })}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          ${income.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(getEditUrl(income.id, "income"));
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(income.id);
                              }}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-4">
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="/transactions/new?type=income">
                    <Plus className="mr-2 h-4 w-4" /> Añadir Ingreso Extra
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmación para eliminar ingreso */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el ingreso permanentemente y no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTransactionToDelete(null)}>
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
