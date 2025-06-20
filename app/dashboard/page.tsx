"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CreditCard,
  DollarSign,
  LineChart,
  PiggyBank,
  Plus,
  Wallet,
  Tags,
  Calendar,
  History,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useFinance } from "@/context/finance-context";
import { getRecurrenceLabel } from "@/lib/recurrence-utils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IncomeExpenseChart } from "@/components/income-expense-chart";
import { RecentTransactions } from "@/components/recent-transactions";
import { ExpensesBreakdown } from "@/components/expenses-breakdown";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function Dashboard() {
  const router = useRouter();
  const { status } = useSession();
  const {
    state,
    getTotalBalance,
    getTotalIncome,
    getTotalExpenses,
    getCurrentMonthIncome,
    getCurrentMonthExpenses,
    getCurrentMonthBalance,
  } = useFinance();

  // Estado para el toggle entre vista mensual y total
  const [viewMode, setViewMode] = useState<"month" | "total">("month");

  // Funciones helper para obtener valores según el modo de vista
  const getDisplayIncome = () => {
    return viewMode === "month" ? getCurrentMonthIncome() : getTotalIncome();
  };

  const getDisplayExpenses = () => {
    return viewMode === "month"
      ? getCurrentMonthExpenses()
      : getTotalExpenses();
  };

  const getDisplayBalance = () => {
    return viewMode === "month" ? getCurrentMonthBalance() : getTotalBalance();
  };

  // Redirigir si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Mostrar indicador de carga mientras se verifica la sesión
  if (status === "loading" || state.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  // Si no está autenticado, no renderizar el contenido
  if (status === "unauthenticated") {
    return null;
  }

  // Calcular el total de deudas (suma de todas las transacciones con categoría "Deudas")
  const totalDebts = state.debts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const activeDebtsCount = state.debts.filter(
    (d) => d.remainingAmount > 0
  ).length;

  // Formatear cantidades monetarias
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("es-PA", {
      style: "currency",
      currency: state.settings.currency || "USD",
    }).format(amount);
  };

  // Obtener el nombre del mes actual para mostrar en la UI
  const getCurrentMonthName = () => {
    const now = new Date();
    return now.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Panel de Control
            </h1>
            <div className="flex items-center gap-2">
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value) =>
                  value && setViewMode(value as "month" | "total")
                }
                className="border"
              >
                <ToggleGroupItem
                  value="month"
                  aria-label="Vista mensual"
                  size="sm"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Este mes</span>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="total"
                  aria-label="Vista total"
                  size="sm"
                >
                  <History className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Histórico</span>
                </ToggleGroupItem>
              </ToggleGroup>
              <Button asChild variant="outline" size="sm">
                <Link href="/transactions/new">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Nueva Transacción</span>
                  <span className="sm:hidden">Nueva</span>
                </Link>
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground text-right">
            {viewMode === "month"
              ? `Viendo datos de: ${getCurrentMonthName()}`
              : "Viendo datos históricos (todos los registros)"}
          </div>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {viewMode === "month" ? "Balance del Mes" : "Balance Total"}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(getDisplayBalance())}
              </div>
              <p className="text-xs text-muted-foreground">
                {viewMode === "month"
                  ? "Balance del mes actual"
                  : "Balance histórico de tus finanzas"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {viewMode === "month" ? "Ingresos del Mes" : "Ingresos Totales"}
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(getDisplayIncome())}
              </div>
              <p className="text-xs text-muted-foreground">
                {viewMode === "month"
                  ? "Ingresos del mes actual"
                  : "Total histórico de ingresos"}
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/transactions?filterType=income">
                  Ver todos los ingresos
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {viewMode === "month" ? "Gastos del Mes" : "Gastos Totales"}
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(getDisplayExpenses())}
              </div>
              <p className="text-xs text-muted-foreground">
                {viewMode === "month"
                  ? "Gastos del mes actual"
                  : "Total histórico de gastos"}
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/transactions?filterType=expense">
                  Ver todos los gastos
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Deudas Pendientes
              </CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(totalDebts)}
              </div>
              <p className="text-xs text-muted-foreground">
                {activeDebtsCount} deudas activas
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/debts">
                  Ver todas las deudas
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="overview" className="py-2">
              Resumen
            </TabsTrigger>
            <TabsTrigger value="analytics" className="py-2">
              Análisis
            </TabsTrigger>
            <TabsTrigger value="reports" className="py-2">
              Informes
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
              <Card className="col-span-1 lg:col-span-4">
                <CardHeader>
                  <CardTitle>Ingresos vs Gastos</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <IncomeExpenseChart />
                </CardContent>
              </Card>
              <Card className="col-span-1 lg:col-span-3">
                <CardHeader>
                  <CardTitle>Transacciones Recientes</CardTitle>
                  <CardDescription>
                    {state.transactions.length > 0
                      ? `Tienes ${state.transactions.length} transacciones registradas.`
                      : "No hay transacciones registradas aún."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentTransactions />
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/transactions">
                      Ver todas las transacciones
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
              <Card className="col-span-1 lg:col-span-3">
                <CardHeader>
                  <CardTitle>Desglose de Gastos</CardTitle>
                  <CardDescription>
                    Distribución de tus gastos por categoría.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpensesBreakdown />
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/categories">
                      Gestionar categorías
                      <Tags className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
              <Card className="col-span-1 lg:col-span-4">
                <CardHeader>
                  <CardTitle>Próximos Pagos</CardTitle>
                  <CardDescription>
                    Pagos programados para los próximos 30 días.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {state.transactions.filter(
                    (t) => t.type === "expense" && t.recurrence !== "none"
                  ).length > 0 ? (
                    <div className="space-y-8">
                      {state.transactions
                        .filter(
                          (t) => t.type === "expense" && t.recurrence !== "none"
                        )
                        .slice(0, 4)
                        .map((payment) => (
                          <div key={payment.id} className="flex items-start">
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium leading-none">
                                {payment.description}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(payment.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="ml-4 flex flex-col items-end space-y-1">
                              <p className="text-sm font-medium leading-none">
                                {formatAmount(payment.amount)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {getRecurrenceLabel(payment.recurrence)}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay pagos programados aún
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/expenses">
                      Administrar pagos
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análisis Financiero</CardTitle>
                <CardDescription>
                  Visualiza tendencias y patrones en tus finanzas.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <LineChart className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">
                    Análisis Detallado
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Aquí encontrarás gráficos y análisis detallados de tus
                    finanzas.
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/analytics">Ver análisis completo</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informes Financieros</CardTitle>
                <CardDescription>
                  Genera y descarga informes personalizados.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <LineChart className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">
                    Informes Personalizados
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Genera informes detallados de tus finanzas por período o
                    categoría.
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/reports">Generar informes</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
