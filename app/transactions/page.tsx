"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Plus,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useFinance } from "@/context/finance-context";

export default function TransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useFinance();
  const { status } = useSession();

  // Leer parámetros de URL
  const initialFilterType = searchParams.get("filterType") || "all";
  const initialFilterCategory = searchParams.get("filterCategory") || "all";
  const initialSearchTerm = searchParams.get("search") || "";

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [filterType, setFilterType] = useState(initialFilterType);
  const [filterCategory, setFilterCategory] = useState(initialFilterCategory);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [displayedTransactions, setDisplayedTransactions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const ITEMS_PER_PAGE = 10;

  // Redirigir si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Actualizar la URL cuando cambian los filtros
  const updateUrlWithFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (filterType !== "all") params.set("filterType", filterType);
    if (filterCategory !== "all") params.set("filterCategory", filterCategory);
    if (searchTerm) params.set("search", searchTerm);

    const url = params.toString()
      ? `/transactions?${params.toString()}`
      : "/transactions";
    window.history.replaceState({}, "", url);
  }, [filterType, filterCategory, searchTerm]);

  // Actualizar URL cuando cambien los filtros
  useEffect(() => {
    updateUrlWithFilters();
  }, [filterType, filterCategory, searchTerm, updateUrlWithFilters]);

  const lastTransactionElementRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((p) => p + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [hasMore]
  );

  useEffect(() => {
    let result = [...state.transactions];
    if (searchTerm) {
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterType !== "all") {
      result = result.filter((t) => t.type === filterType);
    }
    if (filterCategory !== "all") {
      result = result.filter((t) => t.category === filterCategory);
    }
    result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setFilteredTransactions(result);
    setPage(1);
  }, [searchTerm, filterType, filterCategory, state.transactions]);

  useEffect(() => {
    const end = page * ITEMS_PER_PAGE;
    setDisplayedTransactions(filteredTransactions.slice(0, end));
    setHasMore(end < filteredTransactions.length);
  }, [filteredTransactions, page]);

  const formatAmount = (tx: any) => {
    const prefix = tx.type === "income" ? "+" : "-";
    return `${prefix}$${Math.abs(tx.amount).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString("es-PA");
  };

  // Mostrar indicador de carga mientras se verifica la sesión
  if (status === "loading") {
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

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            Transacciones
          </h1>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href="/transactions/new">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Nueva Transacción</span>
                <span className="sm:hidden">Nueva</span>
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Transacciones</CardTitle>
            <CardDescription>
              Visualiza y gestiona todas tus transacciones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="income">Ingresos</SelectItem>
                    <SelectItem value="expense">Gastos</SelectItem>
                    <SelectItem value="transfer">Transferencias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {state.categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 flex items-center relative">
                <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar transacciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Categoría
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Fecha
                    </TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedTransactions.length > 0 ? (
                    displayedTransactions.map((tx, i) => (
                      <TableRow
                        key={tx.id}
                        ref={
                          i === displayedTransactions.length - 1
                            ? lastTransactionElementRef
                            : null
                        }
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => router.push(`/transactions/${tx.id}`)}
                      >
                        <TableCell className="font-medium">
                          {tx.description}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {tx.category}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatDate(tx.date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {tx.type === "income" ? (
                              <ArrowUpRight className="mr-1 h-4 w-4 text-emerald-500" />
                            ) : (
                              <ArrowDownLeft className="mr-1 h-4 w-4 text-rose-500" />
                            )}
                            <span className="capitalize hidden sm:inline">
                              {tx.type}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-medium",
                            tx.type === "income"
                              ? "text-emerald-500"
                              : "text-rose-500"
                          )}
                        >
                          {formatAmount(tx)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No se encontraron transacciones
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {hasMore && (
                <div className="flex justify-center py-4">
                  <div className="animate-pulse text-muted-foreground text-sm">
                    Cargando más transacciones...
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
