"use client";

import { useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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
import { useTheme } from "next-themes";
import { useFinance } from "@/context/finance-context";

export default function AnalyticsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { state, getTotalIncome, getTotalExpenses } = useFinance();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Monthly income/expense history data (past 12 months)
  const monthlyData = useMemo(() => {
    if (state.transactions.length === 0) return [];

    const now = new Date();
    const twelveMonthsAgo = subMonths(now, 11);

    // Create an array of all months in the interval
    const months = eachMonthOfInterval({
      start: twelveMonthsAgo,
      end: now,
    });

    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthLabel = format(month, "MMM yyyy", { locale: es });

      // Obtener transacciones del mes
      const incomeTransactions = state.transactions.filter(
        (t) =>
          t.type === "income" &&
          new Date(t.date) >= monthStart &&
          new Date(t.date) <= monthEnd
      );

      const expenseTransactions = state.transactions.filter(
        (t) =>
          t.type === "expense" &&
          new Date(t.date) >= monthStart &&
          new Date(t.date) <= monthEnd
      );

      // Calcular valores ajustados por recurrencia
      const income = incomeTransactions.reduce((sum, t) => {
        let monthlyValue = t.amount;
        if (t.recurrence) {
          switch (t.recurrence) {
            case "daily":
              monthlyValue = t.amount * 30; // Aproximado mensual
              break;
            case "weekly":
              monthlyValue = t.amount * 4.33; // Semanas promedio en un mes
              break;
            case "biweekly":
              monthlyValue = t.amount * 2; // Dos veces al mes
              break;
            case "quarterly":
              monthlyValue = t.amount / 3; // Un tercio por mes
              break;
            case "yearly":
              monthlyValue = t.amount / 12; // Un doceavo por mes
              break;
            // Para 'monthly' y 'none' se mantiene el valor original
          }
        }
        return sum + monthlyValue;
      }, 0);

      const expense = expenseTransactions.reduce((sum, t) => {
        let monthlyValue = t.amount;
        if (t.recurrence) {
          switch (t.recurrence) {
            case "daily":
              monthlyValue = t.amount * 30; // Aproximado mensual
              break;
            case "weekly":
              monthlyValue = t.amount * 4.33; // Semanas promedio en un mes
              break;
            case "biweekly":
              monthlyValue = t.amount * 2; // Dos veces al mes
              break;
            case "quarterly":
              monthlyValue = t.amount / 3; // Un tercio por mes
              break;
            case "yearly":
              monthlyValue = t.amount / 12; // Un doceavo por mes
              break;
            // Para 'monthly' y 'none' se mantiene el valor original
          }
        }
        return sum + monthlyValue;
      }, 0);

      return {
        name: monthLabel,
        ingresos: income,
        gastos: expense,
        balance: income - expense,
      };
    });
  }, [state.transactions]);

  // Savings rate over time
  const savingsRateData = useMemo(() => {
    return monthlyData.map((month) => {
      const savingsRate =
        month.ingresos > 0
          ? ((month.ingresos - month.gastos) / month.ingresos) * 100
          : 0;

      return {
        name: month.name,
        rate: Math.max(-100, Math.min(100, savingsRate)), // Clamp between -100% and 100%
      };
    });
  }, [monthlyData]);

  // Expense by category for current month
  const categoryData = useMemo(() => {
    if (state.transactions.length === 0) return [];

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Get all expenses for current month
    const expenses = state.transactions.filter(
      (t) =>
        t.type === "expense" &&
        new Date(t.date) >= monthStart &&
        new Date(t.date) <= monthEnd
    );

    // Group by category
    const categories: Record<string, number> = {};
    expenses.forEach((expense) => {
      const category = expense.category || "Sin categoría";
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category] += expense.amount;
    });

    // Convert to array for chart
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Sort by value descending
  }, [state.transactions]);

  // Monthly data for debts
  const debtData = useMemo(() => {
    return monthlyData.map((month) => {
      // Find debt payments for this month from transactions
      const debtPayments = state.transactions
        .filter(
          (t) =>
            t.type === "expense" &&
            t.category === "Deudas" &&
            month.name === format(new Date(t.date), "MMM yyyy", { locale: es })
        )
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        name: month.name,
        debtPayment: debtPayments,
      };
    });
  }, [state.transactions, monthlyData]);

  // Calculate financial indicators
  const financialSummary = useMemo(() => {
    // Total income and expenses
    const totalIncome = getTotalIncome();
    const totalExpenses = getTotalExpenses();

    // Net worth (can add assets - total debt)
    const netWorth = totalIncome - totalExpenses;

    // Average monthly expense (last 6 months)
    const recentMonths = monthlyData.slice(-6);
    const avgMonthlyExpense =
      recentMonths.length > 0
        ? recentMonths.reduce((sum, m) => sum + m.gastos, 0) /
          recentMonths.length
        : 0;

    // Average monthly income (last 6 months)
    const avgMonthlyIncome =
      recentMonths.length > 0
        ? recentMonths.reduce((sum, m) => sum + m.ingresos, 0) /
          recentMonths.length
        : 0;

    // Average savings rate
    const avgSavingsRate =
      avgMonthlyIncome > 0
        ? ((avgMonthlyIncome - avgMonthlyExpense) / avgMonthlyIncome) * 100
        : 0;

    // Emergency fund (in months)
    const emergencyFundMonths =
      avgMonthlyExpense > 0 ? netWorth / avgMonthlyExpense : 0;

    return {
      totalIncome,
      totalExpenses,
      netWorth,
      avgMonthlyExpense,
      avgMonthlyIncome,
      avgSavingsRate,
      emergencyFundMonths,
    };
  }, [getTotalIncome, getTotalExpenses, monthlyData]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PA", {
      style: "currency",
      currency: state.settings.currency || "USD",
    }).format(amount);
  };

  // If loading or not authenticated, show loading state
  if (status === "loading" || state.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Análisis Financiero</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Ahorro Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {financialSummary.avgSavingsRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Media de los últimos 6 meses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Fondo Emergencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(financialSummary.emergencyFundMonths * 10) / 10} meses
            </div>
            <p className="text-xs text-muted-foreground">
              Basado en gastos promedios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Ingreso Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(financialSummary.avgMonthlyIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              Media de los últimos 6 meses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Gasto Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(financialSummary.avgMonthlyExpense)}
            </div>
            <p className="text-xs text-muted-foreground">
              Media de los últimos 6 meses
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="history" className="py-2">
            Historial
          </TabsTrigger>
          <TabsTrigger value="savings" className="py-2">
            Ahorro
          </TabsTrigger>
          <TabsTrigger value="categories" className="py-2">
            Categorías
          </TabsTrigger>
          <TabsTrigger value="debts" className="py-2">
            Deudas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos vs Gastos (12 meses)</CardTitle>
              <CardDescription>
                Histórico mensual de ingresos y gastos
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {monthlyData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No hay suficientes datos para mostrar el gráfico
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? "#333" : "#eee"}
                    />
                    <XAxis
                      dataKey="name"
                      stroke={isDark ? "#888" : "#666"}
                      tick={{ fill: isDark ? "#888" : "#666" }}
                    />
                    <YAxis
                      stroke={isDark ? "#888" : "#666"}
                      tick={{ fill: isDark ? "#888" : "#666" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#fff",
                        borderColor: isDark ? "#374151" : "#e5e7eb",
                        color: isDark ? "#e5e7eb" : "#374151",
                      }}
                      formatter={(value) => [
                        formatCurrency(value as number),
                        "",
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="ingresos"
                      name="Ingresos"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="gastos"
                      name="Gastos"
                      fill="#f43f5e"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="savings">
          <Card>
            <CardHeader>
              <CardTitle>Tasa de Ahorro Mensual</CardTitle>
              <CardDescription>
                Porcentaje de ingresos que ahorras cada mes
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {savingsRateData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No hay suficientes datos para mostrar el gráfico
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={savingsRateData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? "#333" : "#eee"}
                    />
                    <XAxis
                      dataKey="name"
                      stroke={isDark ? "#888" : "#666"}
                      tick={{ fill: isDark ? "#888" : "#666" }}
                    />
                    <YAxis
                      stroke={isDark ? "#888" : "#666"}
                      tick={{ fill: isDark ? "#888" : "#666" }}
                      domain={[-100, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#fff",
                        borderColor: isDark ? "#374151" : "#e5e7eb",
                        color: isDark ? "#e5e7eb" : "#374151",
                      }}
                      formatter={(value) => [
                        `${(value as number).toFixed(1)}%`,
                        "Tasa de Ahorro",
                      ]}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      name="Tasa de Ahorro"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Gastos por Categoría</CardTitle>
              <CardDescription>
                Porcentaje de gastos por categoría en el mes actual
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {categoryData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No hay datos de gastos para el mes actual
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            [
                              "#f44336",
                              "#e91e63",
                              "#9c27b0",
                              "#673ab7",
                              "#3f51b5",
                              "#2196f3",
                              "#03a9f4",
                              "#00bcd4",
                              "#009688",
                              "#4caf50",
                              "#8bc34a",
                              "#cddc39",
                              "#ffeb3b",
                              "#ffc107",
                              "#ff9800",
                              "#ff5722",
                            ][index % 16]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#fff",
                        borderColor: isDark ? "#374151" : "#e5e7eb",
                        color: isDark ? "#e5e7eb" : "#374151",
                      }}
                      formatter={(value) => [
                        formatCurrency(value as number),
                        "Gasto",
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debts">
          <Card>
            <CardHeader>
              <CardTitle>Evolución de Pagos de Deuda</CardTitle>
              <CardDescription>
                Pagos mensuales destinados a deudas
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {debtData.length === 0 ||
              !debtData.some((d) => d.debtPayment > 0) ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No hay datos de pagos de deuda
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={debtData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? "#333" : "#eee"}
                    />
                    <XAxis
                      dataKey="name"
                      stroke={isDark ? "#888" : "#666"}
                      tick={{ fill: isDark ? "#888" : "#666" }}
                    />
                    <YAxis
                      stroke={isDark ? "#888" : "#666"}
                      tick={{ fill: isDark ? "#888" : "#666" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#fff",
                        borderColor: isDark ? "#374151" : "#e5e7eb",
                        color: isDark ? "#e5e7eb" : "#374151",
                      }}
                      formatter={(value) => [
                        formatCurrency(value as number),
                        "Pago",
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="debtPayment"
                      name="Pago de Deuda"
                      stroke="#f43f5e"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
