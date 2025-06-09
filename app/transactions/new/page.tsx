"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useFinance } from "@/context/finance-context";
import { getRecurrenceLabel } from "@/lib/recurrence-utils";
import { getCategoryIcon } from "@/lib/category-utils";

export default function TransactionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { addTransaction, updateTransaction, state } = useFinance();
  const { status } = useSession();

  const transactionId = searchParams.get("id");
  const transactionTypeFromQuery = searchParams.get("type") as
    | "income"
    | "expense"
    | null;
  const isRecurrent = searchParams.get("recurrent") === "true";

  // Redirigir si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const [date, setDate] = useState<Date>(new Date());
  const [type, setType] = useState<"income" | "expense">(
    transactionTypeFromQuery || "expense"
  );
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [recurrence, setRecurrence] = useState(
    isRecurrent ? "monthly" : "none"
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<{
    description?: string;
    amount?: string;
    category?: string;
  }>({});

  // Cargar datos de la transacción existente si hay un ID
  useEffect(() => {
    if (status === "authenticated" && transactionId) {
      const transaction = state.transactions.find(
        (t) => t.id === transactionId
      );

      if (transaction) {
        // Only set income or expense types, ignore transfer type
        setType(transaction.type === "income" ? "income" : "expense");
        setDescription(transaction.description);
        setAmount(transaction.amount.toString());
        setCategory(
          typeof transaction.category === "string"
            ? transaction.category
            : transaction.category &&
              typeof transaction.category === "object" &&
              "name" in transaction.category
            ? (transaction.category as any).name
            : ""
        );
        setDate(new Date(transaction.date));
        setRecurrence(transaction.recurrence || "none");
        setNotes(transaction.notes || "");
      }
    }

    setIsLoading(false);
  }, [status, transactionId, state.transactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validaciones
    const newErrors: {
      description?: string;
      amount?: string;
      category?: string;
    } = {};
    if (!description.trim())
      newErrors.description = "La descripción es requerida";
    if (!amount || Number.parseFloat(amount) <= 0)
      newErrors.amount = "Ingresa un monto válido";
    if (!category) newErrors.category = "Selecciona una categoría";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const transactionData = {
        description,
        amount: Number.parseFloat(amount),
        date: date.toISOString(),
        type,
        category,
        recurrence: recurrence as any,
        notes,
      };

      if (transactionId) {
        // Actualizar transacción existente
        await updateTransaction(transactionId, transactionData);
        toast({
          title: "Transacción actualizada",
          description: "La transacción ha sido actualizada correctamente",
        });
      } else {
        // Crear nueva transacción
        await addTransaction(transactionData);
        toast({
          title: "Transacción creada",
          description: "La transacción ha sido creada correctamente",
        });
      }

      // Redirigir según el tipo de transacción
      if (type === "income") {
        router.push("/income");
      } else if (type === "expense") {
        router.push("/expenses");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error al guardar la transacción:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la transacción. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = state.categories.filter(
    (cat) => cat.type === type || cat.type === "both"
  );

  // Mostrar indicador de carga mientras se verifica la sesión
  if (status === "loading" || isLoading) {
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
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link
              href={
                type === "income"
                  ? "/income"
                  : type === "expense"
                  ? "/expenses"
                  : "/dashboard"
              }
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            {transactionId ? "Editar Transacción" : "Nueva Transacción"}
          </h1>
        </div>

        {state.error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 dark:bg-red-900/30">
            {state.error}
          </div>
        )}

        <Card className="max-w-2xl mx-auto w-full">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Detalles de la Transacción</CardTitle>
              <CardDescription>
                {transactionId
                  ? "Modifica los detalles de la transacción."
                  : "Ingresa los detalles de tu nueva transacción."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tipo de transacción */}
              <div className="space-y-2">
                <Label>Tipo de Transacción</Label>
                <RadioGroup
                  value={type}
                  onValueChange={(v) => setType(v as any)}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="expense" id="expense" />
                    <Label htmlFor="expense" className="cursor-pointer">
                      Gasto
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="income" id="income" />
                    <Label htmlFor="income" className="cursor-pointer">
                      Ingreso
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Descripción
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe la transacción"
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm">{errors.description}</p>
                )}
              </div>

              {/* Monto */}
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Monto <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    $
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className={`pl-8 ${errors.amount ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.amount && (
                  <p className="text-red-500 text-sm">{errors.amount}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Categoría */}
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Categoría <span className="text-red-500">*</span>
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger
                      id="category"
                      className={errors.category ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((cat) => {
                          const IconComponent = getCategoryIcon(cat.icon);
                          return (
                            <SelectItem key={cat.id} value={cat.name}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: cat.color }}
                                >
                                  <IconComponent className="h-2.5 w-2.5 text-white" />
                                </div>
                                {cat.name}
                              </div>
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem value="none" disabled>
                          No hay categorías disponibles
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-red-500 text-sm">{errors.category}</p>
                  )}
                </div>

                {/* Fecha */}
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date
                          ? date.toLocaleDateString("es-PA")
                          : "Selecciona una fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => d && setDate(d)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Recurrencia */}
              <div className="space-y-2">
                <Label htmlFor="recurrence">Recurrencia</Label>
                <Select value={recurrence} onValueChange={setRecurrence}>
                  <SelectTrigger id="recurrence">
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin recurrencia</SelectItem>
                    <SelectItem value="daily">Diaria</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quincenal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notas adicionales */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notas adicionales</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agrega notas o detalles adicionales"
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" asChild>
                <Link
                  href={
                    type === "income"
                      ? "/income"
                      : type === "expense"
                      ? "/expenses"
                      : "/dashboard"
                  }
                >
                  Cancelar
                </Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Guardando..."
                  : transactionId
                  ? "Actualizar Transacción"
                  : "Guardar Transacción"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
