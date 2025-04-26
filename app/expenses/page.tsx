"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Edit, Plus, TrendingDown, Trash } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";

import { useFinance } from "@/context/finance-context";
import { Transaction, Budget, Category } from "@/context/finance-context";
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

export default function ExpensesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { state, getExpenses, deleteTransaction } = useFinance();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("0");
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalFixedExpense, setTotalFixedExpense] = useState(0);
  const [totalVariableExpense, setTotalVariableExpense] = useState(0);
  const [monthlyAvg, setMonthlyAvg] = useState(0);
  const [percentageChange, setPercentageChange] = useState(0);
  const [topCategories, setTopCategories] = useState<[string, number][]>([]);
  const [allExpenses, setAllExpenses] = useState<Transaction[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<Transaction[]>([]);
  const [variableExpenses, setVariableExpenses] = useState<Transaction[]>([]);
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
    // Mostrar un mensaje de loading mientras se carga la sesión
    if (status === "loading") return;

    if (status === "authenticated") {
      loadData();
      setIsLoading(false);
    } else {
      // Redirigir a la página de login si el usuario no está autenticado
      router.push("/login");
    }
  }, [status, state.transactions]);

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
        title: "Gasto eliminado",
        description: "El gasto ha sido eliminado correctamente",
      });

      // Actualizar los datos después de eliminar
      loadData();

      setTransactionToDelete(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error al eliminar transacción:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el gasto",
        variant: "destructive",
      });
    }
  };

  const loadData = () => {
    try {
      // Obtener todos los gastos del contexto
      const expenses = getExpenses();

      // Ordenar por fecha (más reciente primero)
      const sortedExpenses = [...expenses].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setAllExpenses(sortedExpenses);

      // Filtrar gastos fijos (recurrentes)
      const fixed = sortedExpenses.filter(
        (expense) => expense.recurrence && expense.recurrence !== "none"
      );
      setFixedExpenses(fixed);

      // Filtrar gastos variables (no recurrentes)
      const variable = sortedExpenses.filter(
        (expense) => !expense.recurrence || expense.recurrence === "none"
      );
      setVariableExpenses(variable);

      // Calcular totales
      const totalAmount = sortedExpenses.reduce((sum, expense) => {
        // Convertir a valor mensual según la frecuencia de recurrencia
        let monthlyValue = expense.amount;
        if (expense.recurrence) {
          switch (expense.recurrence) {
            case "daily":
              monthlyValue = expense.amount * 30; // Aproximado mensual
              break;
            case "weekly":
              monthlyValue = expense.amount * 4.33; // Semanas promedio en un mes
              break;
            case "biweekly":
              monthlyValue = expense.amount * 2; // Dos veces al mes
              break;
            case "quarterly":
              monthlyValue = expense.amount / 3; // Un tercio por mes
              break;
            case "yearly":
              monthlyValue = expense.amount / 12; // Un doceavo por mes
              break;
            // Para 'monthly' y 'none' se mantiene el valor original
          }
        }
        return sum + monthlyValue;
      }, 0);

      const totalFixedAmount = fixed.reduce((sum, expense) => {
        // Convertir a valor mensual según la frecuencia de recurrencia
        let monthlyValue = expense.amount;
        if (expense.recurrence) {
          switch (expense.recurrence) {
            case "daily":
              monthlyValue = expense.amount * 30; // Aproximado mensual
              break;
            case "weekly":
              monthlyValue = expense.amount * 4.33; // Semanas promedio en un mes
              break;
            case "biweekly":
              monthlyValue = expense.amount * 2; // Dos veces al mes
              break;
            case "quarterly":
              monthlyValue = expense.amount / 3; // Un tercio por mes
              break;
            case "yearly":
              monthlyValue = expense.amount / 12; // Un doceavo por mes
              break;
            // Para 'monthly' se mantiene el valor original
          }
        }
        return sum + monthlyValue;
      }, 0);

      const totalVariableAmount = variable.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );

      // Calcular media mensual (últimos 6 meses)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const recentExpenses = sortedExpenses.filter(
        (expense) => new Date(expense.date) >= sixMonthsAgo
      );

      const monthlyAverage =
        recentExpenses.length > 0
          ? recentExpenses.reduce((sum, expense) => sum + expense.amount, 0) / 6
          : 0;

      // Calcular cambios porcentuales (comparando con el mes anterior)
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

      const currentMonthExpenses = sortedExpenses.filter(
        (expense) => new Date(expense.date) >= oneMonthAgo
      );

      const previousMonthExpenses = sortedExpenses.filter(
        (expense) =>
          new Date(expense.date) >= twoMonthsAgo &&
          new Date(expense.date) < oneMonthAgo
      );

      const currentMonthTotal = currentMonthExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );

      const previousMonthTotal = previousMonthExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );

      const changePct =
        previousMonthTotal > 0
          ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) *
            100
          : 0;

      // Calcular gastos por categoría
      const expensesByCategory: Record<string, number> = {};

      sortedExpenses.forEach((expense) => {
        const categoryName = getCategoryName(expense.category);

        if (!expensesByCategory[categoryName]) {
          expensesByCategory[categoryName] = 0;
        }
        expensesByCategory[categoryName] += expense.amount;
      });

      // Obtener las categorías con mayor gasto
      const topCategoryItems = Object.entries(expensesByCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      // Actualizar el estado
      setTotalExpense(totalAmount);
      setTotalFixedExpense(totalFixedAmount);
      setTotalVariableExpense(totalVariableAmount);
      setMonthlyAvg(monthlyAverage);
      setPercentageChange(changePct);
      setTopCategories(topCategoryItems);
    } catch (error) {
      console.error("Error al cargar datos de gastos:", error);
      setError("Error al cargar datos. Intente de nuevo más tarde.");
    }
  };

  // Función para obtener el nombre de la categoría de manera segura
  const getCategoryName = (category: any): string => {
    if (typeof category === "string") {
      return category;
    }
    if (category && typeof category === "object" && "name" in category) {
      return category.name;
    }
    return String(category);
  };

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

  // Obtener todos los presupuestos
  const budgets = state.budgets;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gastos</h1>
        <Button asChild>
          <Link href="/transactions/new?type=expense">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Gasto
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Gastos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpense.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <span
                className={cn(
                  percentageChange < 0
                    ? "text-green-500"
                    : percentageChange > 0
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
            <CardTitle className="text-md font-medium">Gastos Fijos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalFixedExpense.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalExpense > 0
                ? ((totalFixedExpense / totalExpense) * 100).toFixed(1)
                : "0"}
              % del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Gastos Variables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalVariableExpense.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalExpense > 0
                ? ((totalVariableExpense / totalExpense) * 100).toFixed(1)
                : "0"}
              % del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Media Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlyAvg.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Basado en los últimos 6 meses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sección de categorías principales */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">
          Principales Categorías de Gastos
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {topCategories.map(([category, amount]) => {
            const budget = budgets.find((budget) => {
              const budgetCategory = getCategoryName(budget.category);
              return budgetCategory === category;
            });

            const percentUsed = budget ? (amount / budget.amount) * 100 : 100;

            return (
              <Card key={category} className="w-full">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2">
                        {category}
                      </Badge>
                      <span className="font-medium">${amount.toFixed(2)}</span>
                    </div>
                    {budget && (
                      <span className="text-sm text-muted-foreground">
                        de ${budget.amount.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <Progress
                    value={percentUsed > 100 ? 100 : percentUsed}
                    className={cn(
                      "h-2",
                      percentUsed > 90 ? "bg-red-200" : "bg-slate-200",
                      percentUsed > 90 ? "[&>div]:bg-red-500" : ""
                    )}
                  />
                  {budget && (
                    <div className="flex justify-end mt-1">
                      <span
                        className={cn(
                          "text-xs",
                          percentUsed > 90
                            ? "text-red-500"
                            : "text-muted-foreground"
                        )}
                      >
                        {percentUsed.toFixed(0)}% del presupuesto
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {topCategories.map(([category, amount], index) => (
            <div key={index}>
              {category}: ${amount.toFixed(2)}
            </div>
          ))}
          <div className="mt-1 font-medium">
            (Valores ajustados a equivalente mensual)
          </div>
        </div>
      </div>

      <Tabs defaultValue="0" onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="0">Todos</TabsTrigger>
          <TabsTrigger value="1">Fijos</TabsTrigger>
          <TabsTrigger value="2">Variables</TabsTrigger>
        </TabsList>
        <TabsContent value="0">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Historial de Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>Lista de todos tus gastos</TableCaption>
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
                  {allExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No hay gastos registrados.
                        <Link
                          href="/transactions/new?type=expense"
                          className="ml-2 text-blue-500 hover:underline"
                        >
                          Añadir uno
                        </Link>
                      </TableCell>
                    </TableRow>
                  ) : (
                    allExpenses.map((expense) => (
                      <TableRow
                        key={expense.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() =>
                          router.push(`/transactions/${expense.id}`)
                        }
                      >
                        <TableCell className="font-medium cursor-pointer hover:text-blue-600">
                          {expense.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getCategoryName(expense.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(expense.date), "dd MMM yyyy", {
                            locale: es,
                          })}
                        </TableCell>
                        <TableCell>
                          {expense.recurrence &&
                          expense.recurrence !== "none" ? (
                            <Badge>{expense.recurrence}</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold text-red-600">
                          -${expense.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(getEditUrl(expense.id, "expense"));
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(expense.id);
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

        <TabsContent value="1">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Gastos Fijos (Recurrentes)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>Gastos fijos o recurrentes</TableCaption>
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
                  {fixedExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No hay gastos fijos registrados.
                        <Link
                          href="/transactions/new?type=expense&recurrent=true"
                          className="ml-2 text-blue-500 hover:underline"
                        >
                          Añadir uno
                        </Link>
                      </TableCell>
                    </TableRow>
                  ) : (
                    fixedExpenses.map((expense) => (
                      <TableRow
                        key={expense.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() =>
                          router.push(`/transactions/${expense.id}`)
                        }
                      >
                        <TableCell className="font-medium cursor-pointer hover:text-blue-600">
                          {expense.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getCategoryName(expense.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge>{expense.recurrence}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-red-600">
                          -${expense.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/transactions/${expense.id}`);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(expense.id);
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
                  <Link href="/transactions/new?type=expense&recurrent=true">
                    <Plus className="mr-2 h-4 w-4" /> Añadir Gasto Fijo
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="2">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Gastos Variables (No Recurrentes)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>Gastos variables o no recurrentes</TableCaption>
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
                  {variableExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No hay gastos variables registrados.
                        <Link
                          href="/transactions/new?type=expense"
                          className="ml-2 text-blue-500 hover:underline"
                        >
                          Añadir uno
                        </Link>
                      </TableCell>
                    </TableRow>
                  ) : (
                    variableExpenses.map((expense) => (
                      <TableRow
                        key={expense.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() =>
                          router.push(`/transactions/${expense.id}`)
                        }
                      >
                        <TableCell className="font-medium cursor-pointer hover:text-blue-600">
                          {expense.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getCategoryName(expense.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(expense.date), "dd MMM yyyy", {
                            locale: es,
                          })}
                        </TableCell>
                        <TableCell className="text-right font-bold text-red-600">
                          -${expense.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/transactions/${expense.id}`);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(expense.id);
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
                  <Link href="/transactions/new?type=expense">
                    <Plus className="mr-2 h-4 w-4" /> Añadir Gasto Variable
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmación para eliminar gasto */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el gasto permanentemente y no se puede
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
