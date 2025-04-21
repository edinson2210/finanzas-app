"use client";

import { useTheme } from "next-themes";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFinance } from "@/context/finance-context";
import { useMemo } from "react";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  isSameMonth,
} from "date-fns";
import { es } from "date-fns/locale";

export function IncomeExpenseChart() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { state } = useFinance();

  // Generar datos para los últimos 6 meses
  const chartData = useMemo(() => {
    // Si no hay transacciones, mostrar mensaje de que no hay datos
    if (state.transactions.length === 0) {
      return [];
    }

    const months = [];
    const today = new Date();

    // Generar datos para los últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthLabel = format(monthDate, "MMM", { locale: es });

      const monthIncomes = state.transactions
        .filter(
          (t) => t.type === "income" && isSameMonth(new Date(t.date), monthDate)
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const monthExpenses = state.transactions
        .filter(
          (t) =>
            t.type === "expense" && isSameMonth(new Date(t.date), monthDate)
        )
        .reduce((sum, t) => sum + t.amount, 0);

      months.push({
        name: monthLabel,
        ingresos: monthIncomes,
        gastos: monthExpenses,
      });
    }

    return months;
  }, [state.transactions]);

  // Si no hay datos, mostrar mensaje
  if (chartData.length === 0) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center text-muted-foreground">
        No hay datos suficientes para mostrar el gráfico
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
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
          formatter={(value) => [`$${value}`, ""]}
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
  );
}
