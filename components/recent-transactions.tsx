"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinance } from "@/context/finance-context";
import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { getCategoryIconByName } from "@/lib/category-utils";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";

// Usando el sistema unificado de iconos desde category-utils

export function RecentTransactions() {
  const { state } = useFinance();
  const router = useRouter();

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
        // Obtenemos el icono usando el sistema unificado
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
    <div className="overflow-x-auto pb-2">
      {recentTransactions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hay transacciones recientes.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
              <TableHead className="hidden sm:table-cell">Categoría</TableHead>
              <TableHead className="hidden md:table-cell">Fecha</TableHead>
              <TableHead className="text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentTransactions
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )
              .slice(0, 5)
              .map((transaction) => (
                <TableRow
                  key={transaction.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/transactions/${transaction.id}`)}
                >
                  <TableCell className="font-medium max-w-[150px] truncate">
                    {transaction.description}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const IconComponent = getCategoryIconByName(
                          transaction.category,
                          state.categories
                        );
                        return <IconComponent className="h-3 w-3" />;
                      })()}
                      {transaction.category}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {transaction.date}
                  </TableCell>
                  <TableCell
                    className={`text-right ${
                      transaction.type === "expense"
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {transaction.amount}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
