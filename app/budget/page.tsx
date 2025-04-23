"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useFinance } from "@/context/finance-context";
import { cn } from "@/lib/utils";
import { Budget } from "@/context/finance-context";

// Definir el esquema de validación para el formulario de presupuesto
const budgetFormSchema = z.object({
  category: z.string().min(1, "La categoría es obligatoria"),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  period: z.enum(["weekly", "monthly", "yearly"], {
    required_error: "Selecciona un período",
  }),
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

export default function BudgetPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const {
    state,
    fetchAllData,
    getExpenses,
    addBudget,
    updateBudget,
    deleteBudget,
  } = useFinance();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form para nuevo presupuesto
  const newBudgetForm = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      category: "",
      amount: 0,
      period: "monthly",
    },
  });

  // Form para editar presupuesto
  const editBudgetForm = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      category: "",
      amount: 0,
      period: "monthly",
    },
  });

  // Redirigir si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Cargar datos cuando el componente se monta
  useEffect(() => {
    const loadData = () => {
      try {
        // Usar los datos que ya están en el contexto, no llamar a fetchAllData
        setIsLoading(false);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      loadData();
    }
  }, [status]); // Quito fetchAllData de las dependencias

  // Actualizar formulario de edición cuando se selecciona un presupuesto
  useEffect(() => {
    if (selectedBudget) {
      editBudgetForm.reset({
        category: selectedBudget.category,
        amount: selectedBudget.amount,
        period: selectedBudget.period as "weekly" | "monthly" | "yearly",
      });
    }
  }, [selectedBudget, editBudgetForm]);

  // Manejar creación de nuevo presupuesto
  const handleCreateBudget = async (values: BudgetFormValues) => {
    try {
      await addBudget(values);
      setIsNewDialogOpen(false);
      newBudgetForm.reset({
        category: "",
        amount: 0,
        period: "monthly",
      });
    } catch (error) {
      console.error("Error al crear presupuesto:", error);
    }
  };

  // Manejar actualización de presupuesto
  const handleUpdateBudget = async (values: BudgetFormValues) => {
    if (!selectedBudget) return;

    try {
      await updateBudget(selectedBudget.id, values);
      setIsEditDialogOpen(false);
      setSelectedBudget(null);
    } catch (error) {
      console.error("Error al actualizar presupuesto:", error);
    }
  };

  // Manejar eliminación de presupuesto
  const handleDeleteBudget = async () => {
    if (!selectedBudget) return;

    try {
      await deleteBudget(selectedBudget.id);
      setIsDeleteDialogOpen(false);
      setSelectedBudget(null);
    } catch (error) {
      console.error("Error al eliminar presupuesto:", error);
    }
  };

  // Obtener todos los gastos
  const allExpenses = getExpenses();

  // Obtener presupuestos
  const budgets = state.budgets || [];

  // Obtener categorías (para crear nuevos presupuestos)
  const expenseCategories = state.categories.filter(
    (cat) => cat.type === "expense" || cat.type === "both"
  );

  // Calcular gasto por categoría
  const expensesByCategory: Record<string, number> = {};
  allExpenses.forEach((expense) => {
    if (!expensesByCategory[expense.category]) {
      expensesByCategory[expense.category] = 0;
    }
    expensesByCategory[expense.category] += expense.amount;
  });

  // Calcular presupuestos con porcentaje de uso
  const budgetsWithUsage = budgets.map((budget) => {
    const spent = expensesByCategory[budget.category] || 0;
    const percentUsed = (spent / budget.amount) * 100;
    return {
      ...budget,
      spent,
      percentUsed,
    };
  });

  // Ordenar presupuestos por porcentaje de uso (descendente)
  const sortedBudgets = [...budgetsWithUsage].sort(
    (a, b) => b.percentUsed - a.percentUsed
  );

  // Calcular estadísticas
  const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = budgetsWithUsage.reduce(
    (sum, budget) => sum + budget.spent,
    0
  );
  const overBudgetCount = budgetsWithUsage.filter(
    (budget) => budget.percentUsed > 100
  ).length;
  const nearLimitCount = budgetsWithUsage.filter(
    (budget) => budget.percentUsed > 80 && budget.percentUsed <= 100
  ).length;

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

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Presupuestos</h1>
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Presupuesto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear nuevo presupuesto</DialogTitle>
              <DialogDescription>
                Asigna un presupuesto a una categoría de gastos
              </DialogDescription>
            </DialogHeader>
            <Form {...newBudgetForm}>
              <form
                onSubmit={newBudgetForm.handleSubmit(handleCreateBudget)}
                className="space-y-4"
              >
                <FormField
                  control={newBudgetForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {expenseCategories
                            .filter(
                              (category) =>
                                !budgets.some(
                                  (budget) => budget.category === category.name
                                )
                            )
                            .map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.name}
                              >
                                {category.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={newBudgetForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={newBudgetForm.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Periodo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un periodo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensual</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Guardar</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumen de presupuestos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Total Presupuestado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalBudgeted.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {budgets.length}{" "}
              {budgets.length === 1 ? "categoría" : "categorías"} con
              presupuesto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Gasto Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {totalBudgeted > 0
                ? ((totalSpent / totalBudgeted) * 100).toFixed(1)
                : 0}
              % del presupuesto total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Presupuestos Excedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overBudgetCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {budgets.length > 0
                ? ((overBudgetCount / budgets.length) * 100).toFixed(0)
                : 0}
              % de tus presupuestos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Cerca del Límite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {nearLimitCount}
            </div>
            <p className="text-xs text-muted-foreground">
              +80% del presupuesto asignado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de presupuestos */}
      <Card>
        <CardHeader>
          <CardTitle>Presupuestos por Categoría</CardTitle>
          <CardDescription>
            Administra tus presupuestos mensuales por categoría
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Lista de presupuestos</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Presupuestado</TableHead>
                <TableHead>Gastado</TableHead>
                <TableHead>Porcentaje</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedBudgets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No hay presupuestos configurados.
                  </TableCell>
                </TableRow>
              ) : (
                sortedBudgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell className="font-medium">
                      <Badge variant="outline">{budget.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>
                        {budget.period === "weekly" && "Semanal"}
                        {budget.period === "monthly" && "Mensual"}
                        {budget.period === "yearly" && "Anual"}
                      </Badge>
                    </TableCell>
                    <TableCell>${budget.amount.toFixed(2)}</TableCell>
                    <TableCell>${budget.spent.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={
                            budget.percentUsed > 100 ? 100 : budget.percentUsed
                          }
                          className={cn(
                            "h-2 w-[60px]",
                            budget.percentUsed > 100
                              ? "bg-red-200 [&>div]:bg-red-500"
                              : budget.percentUsed > 80
                              ? "bg-amber-200 [&>div]:bg-amber-500"
                              : "bg-slate-200"
                          )}
                        />
                        <span
                          className={cn(
                            "text-xs",
                            budget.percentUsed > 100
                              ? "text-red-500"
                              : budget.percentUsed > 80
                              ? "text-amber-500"
                              : "text-muted-foreground"
                          )}
                        >
                          {budget.percentUsed.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {budget.percentUsed > 100 ? (
                        <Badge variant="destructive">Excedido</Badge>
                      ) : budget.percentUsed > 80 ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-100 text-amber-800 hover:bg-amber-100"
                        >
                          Alerta
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800 hover:bg-green-100"
                        >
                          Normal
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog
                          open={
                            isEditDialogOpen && selectedBudget?.id === budget.id
                          }
                          onOpenChange={(open) => {
                            setIsEditDialogOpen(open);
                            if (open) setSelectedBudget(budget);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar presupuesto</DialogTitle>
                              <DialogDescription>
                                Modifica los detalles del presupuesto para{" "}
                                {budget.category}
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...editBudgetForm}>
                              <form
                                onSubmit={editBudgetForm.handleSubmit(
                                  handleUpdateBudget
                                )}
                                className="space-y-4"
                              >
                                <FormField
                                  control={editBudgetForm.control}
                                  name="amount"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Monto</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={editBudgetForm.control}
                                  name="period"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Periodo</FormLabel>
                                      <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un periodo" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="weekly">
                                            Semanal
                                          </SelectItem>
                                          <SelectItem value="monthly">
                                            Mensual
                                          </SelectItem>
                                          <SelectItem value="yearly">
                                            Anual
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <DialogFooter>
                                  <Button type="submit">Guardar cambios</Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog
                          open={
                            isDeleteDialogOpen &&
                            selectedBudget?.id === budget.id
                          }
                          onOpenChange={(open) => {
                            setIsDeleteDialogOpen(open);
                            if (open) setSelectedBudget(budget);
                          }}
                        >
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                ¿Estás seguro?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará el presupuesto para{" "}
                                {budget.category} y no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDeleteBudget}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Categorías sin presupuesto */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Categorías sin Presupuesto</CardTitle>
          <CardDescription>
            Estas categorías de gastos no tienen presupuesto asignado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {expenseCategories
              .filter(
                (category) =>
                  !budgets.some((budget) => budget.category === category.name)
              )
              .map((category) => (
                <Card key={category.id}>
                  <CardContent className="pt-4 pb-2">
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">{category.name}</Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              newBudgetForm.reset({
                                category: category.name,
                                amount: 0,
                                period: "monthly",
                              });
                              setIsNewDialogOpen(true);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Asignar
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            {expenseCategories.filter(
              (category) =>
                !budgets.some((budget) => budget.category === category.name)
            ).length === 0 && (
              <div className="col-span-full text-center text-muted-foreground py-8">
                Todas las categorías de gastos tienen presupuestos asignados.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
