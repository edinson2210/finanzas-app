"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  ShoppingBag,
  Home,
  CreditCard,
  Building,
  Book,
  Plane,
  Coffee,
  Briefcase,
  Heart,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinance } from "@/context/finance-context";
import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// Mapeo de iconos por categoría
const CATEGORY_ICONS: Record<string, any> = {
  Trabajo: Briefcase,
  Alimentación: ShoppingBag,
  Vivienda: Home,
  Servicios: Building,
  Deudas: CreditCard,
  Educación: Book,
  Viajes: Plane,
  Ocio: Coffee,
  Salud: Heart,
  Regalos: Gift,
  // Icono por defecto
  default: DollarSign,
};

export function RecentTransactions() {
  const { state } = useFinance();

  // Procesar las transacciones recientes
  const recentTransactions = useMemo(() => {
    if (!state.transactions || state.transactions.length === 0) {
      return [];
    }

    // Ordenar por fecha (más reciente primero) y tomar las 4 más recientes
    return [...state.transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4)
      .map((transaction) => {
        const icon =
          CATEGORY_ICONS[transaction.category] || CATEGORY_ICONS.default;
        const formattedDate = formatDistanceToNow(new Date(transaction.date), {
          addSuffix: true,
          locale: es,
        });

        return {
          id: transaction.id,
          description: transaction.description,
          amount:
            transaction.type === "income"
              ? `+$${transaction.amount.toFixed(2)}`
              : `-$${transaction.amount.toFixed(2)}`,
          date: formattedDate,
          type: transaction.type,
          category: transaction.category,
          icon,
        };
      });
  }, [state.transactions]);

  // Si no hay transacciones, mostrar mensaje
  if (recentTransactions.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No hay transacciones recientes
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recentTransactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center">
          <div className="mr-4 flex h-9 w-9 items-center justify-center rounded-full bg-muted">
            <transaction.icon className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">
              {transaction.description}
            </p>
            <p className="text-xs text-muted-foreground">
              {transaction.category}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <p
              className={cn(
                "text-sm font-medium",
                transaction.type === "income"
                  ? "text-green-500"
                  : "text-red-500"
              )}
            >
              <span className="inline-flex items-center">
                {transaction.type === "income" ? (
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                ) : (
                  <ArrowDownLeft className="mr-1 h-3 w-3" />
                )}
                {transaction.amount}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">{transaction.date}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
