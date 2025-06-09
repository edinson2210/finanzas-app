"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Edit, Trash } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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

import { useFinance, Transaction } from "@/context/finance-context";
import { getRecurrenceLabel } from "@/lib/recurrence-utils";
import { getCategoryIconByName } from "@/lib/category-utils";

export default function TransactionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data: session, status } = useSession();
  const { state, deleteTransaction } = useFinance();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Cargar datos de la transacción
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      // Buscar la transacción en el estado
      const foundTransaction = state.transactions.find((t) => t.id === id);

      if (foundTransaction) {
        setTransaction(foundTransaction);
      } else {
        setError("Transacción no encontrada");
      }

      setIsLoading(false);
    }
  }, [status, id, state.transactions]);

  function getEditUrl(id: string, type: string) {
    return `/transactions/new?id=${id}&type=${type}`;
  }

  // Función para manejar la eliminación
  const handleDelete = async () => {
    try {
      if (transaction) {
        await deleteTransaction(transaction.id);
        toast({
          title: "Transacción eliminada",
          description: "La transacción ha sido eliminada correctamente",
        });

        // Redirigir basado en el tipo de transacción
        if (transaction.type === "income") {
          router.push("/income");
        } else if (transaction.type === "expense") {
          router.push("/expenses");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error al eliminar la transacción:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la transacción",
        variant: "destructive",
      });
    }
  };

  // Función para editar la transacción
  const handleEdit = () => {
    if (transaction) {
      router.push(`/transactions/new?id=${id}&type=${transaction.type}`);
    } else {
      router.push(`/transactions/new?id=${id}`);
    }
  };

  // Función para volver a la página anterior
  const handleGoBack = () => {
    router.back();
  };

  // Si está cargando, mostrar estado de carga
  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-8">
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // Si hay error, mostrar mensaje
  if (error || !transaction) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <h2 className="text-2xl font-bold text-red-500 mb-2">
                {error || "Transacción no encontrada"}
              </h2>
              <p className="text-muted-foreground mb-6">
                No se pudo encontrar la transacción solicitada
              </p>
              <Button onClick={handleGoBack}>Volver</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determinar el tipo de insignia y colores basados en el tipo de transacción
  const getBadgeVariant = () => {
    switch (transaction.type) {
      case "income":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "expense":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "";
    }
  };

  // Traducir el tipo de transacción para mostrar
  const getTypeLabel = () => {
    switch (transaction.type) {
      case "income":
        return "Ingreso";
      case "expense":
        return "Gasto";
      default:
        return transaction.type;
    }
  };

  // Traducir la recurrencia
  const getRecurrenceLabelText = () => {
    return getRecurrenceLabel(transaction.recurrence);
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div className="flex items-center space-x-2 overflow-hidden">
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="p-0 h-auto shrink-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
          </Button>
          <div className="flex items-center text-sm text-muted-foreground overflow-hidden">
            <Link
              href="/dashboard"
              className="hover:underline whitespace-nowrap"
            >
              Dashboard
            </Link>
            <span className="mx-2">/</span>
            {transaction.type === "income" ? (
              <Link
                href="/income"
                className="hover:underline whitespace-nowrap"
              >
                Ingresos
              </Link>
            ) : (
              <Link
                href="/expenses"
                className="hover:underline whitespace-nowrap"
              >
                Gastos
              </Link>
            )}
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium truncate max-w-[150px]">
              {transaction.description}
            </span>
          </div>
        </div>
        <div className="flex space-x-2 mt-2 sm:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="flex-1 sm:flex-auto"
          >
            <Edit className="mr-2 h-4 w-4" /> Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="flex-1 sm:flex-auto"
          >
            <Trash className="mr-2 h-4 w-4" /> Eliminar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {transaction.description}
            </CardTitle>
            <Badge className={getBadgeVariant()}>{getTypeLabel()}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Monto
                </h3>
                <p
                  className={`text-3xl font-bold ${
                    transaction.type === "expense"
                      ? "text-red-600"
                      : transaction.type === "income"
                      ? "text-green-600"
                      : ""
                  }`}
                >
                  {transaction.type === "expense" ? "-" : ""}$
                  {transaction.amount.toFixed(2)}
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Categoría
                </h3>
                <Badge
                  variant="outline"
                  className="text-base px-3 py-1 flex items-center gap-2 w-fit"
                >
                  {(() => {
                    const IconComponent = getCategoryIconByName(
                      transaction.category,
                      state.categories
                    );
                    return <IconComponent className="h-4 w-4" />;
                  })()}
                  {getCategoryName(transaction.category)}
                </Badge>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Fecha
                </h3>
                <p className="text-base">
                  {format(new Date(transaction.date), "dd MMMM yyyy", {
                    locale: es,
                  })}
                </p>
              </div>
            </div>

            <div>
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Tipo de Recurrencia
                </h3>
                <p className="text-base">{getRecurrenceLabelText()}</p>
              </div>

              {transaction.notes && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Notas
                  </h3>
                  <p className="text-base whitespace-pre-line">
                    {transaction.notes}
                  </p>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  ID de Transacción
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {transaction.id}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {transaction.type === "income" && (
        <div className="mt-6">
          <h2 className="text-lg font-medium mb-4">
            Otros ingresos en la misma categoría
          </h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {state.transactions
                  .filter(
                    (t) =>
                      t.id !== transaction.id &&
                      t.type === transaction.type &&
                      getCategoryName(t.category) ===
                        getCategoryName(transaction.category)
                  )
                  .slice(0, 5)
                  .map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/transactions/${t.id}`)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{t.description}</span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(t.date), "dd MMM yyyy", {
                            locale: es,
                          })}
                        </span>
                      </div>
                      <span className="font-bold text-green-600">
                        ${t.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {transaction.type === "expense" && (
        <div className="mt-6">
          <h2 className="text-lg font-medium mb-4">
            Otros gastos en la misma categoría
          </h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {state.transactions
                  .filter(
                    (t) =>
                      t.id !== transaction.id &&
                      t.type === transaction.type &&
                      getCategoryName(t.category) ===
                        getCategoryName(transaction.category)
                  )
                  .slice(0, 5)
                  .map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/transactions/${t.id}`)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{t.description}</span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(t.date), "dd MMM yyyy", {
                            locale: es,
                          })}
                        </span>
                      </div>
                      <span className="font-bold text-red-600">
                        -${t.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Diálogo de confirmación para eliminar transacción */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la transacción permanentemente y no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
