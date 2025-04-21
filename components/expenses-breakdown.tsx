"use client";

import { useTheme } from "next-themes";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useFinance } from "@/context/finance-context";
import { useMemo } from "react";

// Colores para las categorías
const COLORS = [
  "#10b981", // Verde
  "#3b82f6", // Azul
  "#f59e0b", // Ámbar
  "#f43f5e", // Rosa
  "#8b5cf6", // Violeta
  "#06b6d4", // Cyan
  "#ec4899", // Rosa fuerte
  "#84cc16", // Lima
  "#14b8a6", // Teal
  "#6366f1", // Indigo
];

export function ExpensesBreakdown() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { state, getTransactionsByCategory } = useFinance();

  // Procesar datos para el gráfico
  const chartData = useMemo(() => {
    const expensesByCategory = getTransactionsByCategory();

    // Transformar el objeto en un array para el gráfico
    const data = Object.entries(expensesByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return data;
  }, [getTransactionsByCategory]);

  // Si no hay datos, mostrar mensaje
  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
        No hay datos suficientes para mostrar el gráfico
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? "#1f2937" : "#fff",
            borderColor: isDark ? "#374151" : "#e5e7eb",
            color: isDark ? "#e5e7eb" : "#374151",
          }}
          formatter={(value) => [`$${value}`, "Monto"]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
