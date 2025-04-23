"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Plus, Edit, Trash2, PiggyBank, Coins } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useFinance } from "@/context/finance-context";

export default function SavingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const {
    state,
    addSavingGoal,
    updateSavingGoal,
    deleteSavingGoal,
    contributeToSavingGoal,
  } = useFinance();
  const { toast } = useToast();

  // Estado para el formulario de crear/editar meta
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [icon, setIcon] = useState("PiggyBank");
  const [color, setColor] = useState("#10b981");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para el modal de contribución
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [contributionAmount, setContributionAmount] = useState("");

  // Estado para confirmar eliminación
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Resetear el formulario
  const resetForm = () => {
    setName("");
    setDescription("");
    setTargetAmount("");
    setDeadline("");
    setIcon("PiggyBank");
    setColor("#10b981");
    setSelectedGoalId(null);
    setIsEditMode(false);
  };

  // Cargar datos al modal para editar
  const handleEditClick = (goalId: string) => {
    const goal = state.savingGoals.find((g) => g.id === goalId);
    if (!goal) return;

    setName(goal.name);
    setDescription(goal.description || "");
    setTargetAmount(goal.targetAmount.toString());
    if (goal.deadline) {
      setDeadline(new Date(goal.deadline).toISOString().split("T")[0]);
    }
    setIcon(goal.icon || "PiggyBank");
    setColor(goal.color || "#10b981");

    setSelectedGoalId(goalId);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  // Preparar modal para contribuir
  const handleContributeClick = (goalId: string) => {
    setSelectedGoalId(goalId);
    setContributionAmount("");
    setIsContributeModalOpen(true);
  };

  // Manejar contribución a meta
  const handleContribute = async () => {
    if (
      !selectedGoalId ||
      !contributionAmount ||
      isNaN(parseFloat(contributionAmount)) ||
      parseFloat(contributionAmount) <= 0
    ) {
      toast({
        title: "Error",
        description: "Por favor, ingresa un monto válido.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await contributeToSavingGoal(
        selectedGoalId,
        parseFloat(contributionAmount)
      );
      setIsContributeModalOpen(false);
    } catch (error) {
      console.error("Error al contribuir:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preparar confirmación de eliminación
  const handleDeleteClick = (goalId: string) => {
    setSelectedGoalId(goalId);
    setIsDeleteDialogOpen(true);
  };

  // Manejar eliminación de meta
  const handleDeleteConfirm = async () => {
    if (!selectedGoalId) return;

    setIsSubmitting(true);
    try {
      await deleteSavingGoal(selectedGoalId);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error al eliminar:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar envío del formulario (crear/editar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !name ||
      !targetAmount ||
      isNaN(parseFloat(targetAmount)) ||
      parseFloat(targetAmount) <= 0
    ) {
      toast({
        title: "Error",
        description:
          "Por favor, completa todos los campos requeridos con valores válidos.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const goalData = {
        name,
        description,
        targetAmount: parseFloat(targetAmount),
        currentAmount: isEditMode
          ? state.savingGoals.find((g) => g.id === selectedGoalId)
              ?.currentAmount || 0
          : 0,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        icon,
        color,
        status: "active" as const,
      };

      if (isEditMode && selectedGoalId) {
        await updateSavingGoal(selectedGoalId, goalData);
      } else {
        await addSavingGoal(goalData);
      }

      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error al guardar la meta:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatear cantidades monetarias
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("es-PA", {
      style: "currency",
      currency: state.settings.currency || "USD",
    }).format(amount);
  };

  // Calcular el porcentaje completado de una meta
  const calculateProgress = (currentAmount: number, targetAmount: number) => {
    return Math.min(Math.round((currentAmount / targetAmount) * 100), 100);
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
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            Metas de Ahorro
          </h1>
        </div>

        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">
            Establece metas de ahorro y haz un seguimiento de tu progreso.
          </p>
          <Button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Meta
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {state.savingGoals.length === 0 ? (
            <Card className="col-span-full flex flex-col items-center justify-center py-12">
              <PiggyBank className="h-12 w-12 mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                No hay metas de ahorro
              </h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                Empieza a ahorrar estableciendo metas para tus objetivos
                financieros, como comprar una casa, un auto o irte de
                vacaciones.
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear Meta
              </Button>
            </Card>
          ) : (
            state.savingGoals.map((goal) => {
              const progress = calculateProgress(
                goal.currentAmount,
                goal.targetAmount
              );
              const remaining = goal.targetAmount - goal.currentAmount;

              return (
                <Card
                  key={goal.id}
                  className={cn(
                    "overflow-hidden transition-all hover:shadow-md",
                    goal.status === "completed" &&
                      "border-green-200 dark:border-green-900"
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{goal.name}</CardTitle>
                      <div
                        className={cn(
                          "px-2 py-1 text-xs rounded-full",
                          goal.status === "active"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                            : goal.status === "completed"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        )}
                      >
                        {goal.status === "active"
                          ? "Activa"
                          : goal.status === "completed"
                          ? "Completada"
                          : "Cancelada"}
                      </div>
                    </div>
                    <CardDescription>
                      {goal.description || "Sin descripción"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{formatAmount(goal.currentAmount)}</span>
                        <span>{formatAmount(goal.targetAmount)}</span>
                      </div>
                      <Progress
                        value={progress}
                        className={cn(
                          progress >= 100
                            ? "bg-green-100 [&>div]:bg-green-500"
                            : "bg-blue-100 [&>div]:bg-blue-500"
                        )}
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {progress}% completado
                        </span>
                        {goal.deadline && (
                          <span className="text-xs text-muted-foreground">
                            Meta: {new Date(goal.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {goal.status === "active" && (
                      <div className="mt-4 text-sm">
                        <p className="text-muted-foreground">
                          Faltante: {formatAmount(remaining)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex gap-2 justify-end border-t pt-4">
                    {goal.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContributeClick(goal.id)}
                      >
                        <Coins className="mr-1 h-4 w-4" />
                        Contribuir
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClick(goal.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(goal.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      </main>

      {/* Modal para crear/editar meta */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Editar Meta de Ahorro" : "Nueva Meta de Ahorro"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Modifica los detalles de tu meta de ahorro."
                : "Establece una nueva meta para ayudarte a ahorrar."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name" className="mb-2">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Vacaciones en la playa"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="mb-2">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe el propósito de esta meta"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="amount" className="mb-2">
                  Monto a ahorrar <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="deadline" className="mb-2">
                  Fecha límite
                </Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div>
                <Label htmlFor="color" className="mb-2">
                  Color
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-8 p-0"
                  />
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Guardando..."
                  : isEditMode
                  ? "Actualizar"
                  : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para contribuir */}
      <Dialog
        open={isContributeModalOpen}
        onOpenChange={setIsContributeModalOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Contribuir a Meta de Ahorro</DialogTitle>
            <DialogDescription>
              Agrega fondos a tu meta de ahorro.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="contribution" className="mb-2">
                Monto a contribuir
              </Label>
              <Input
                id="contribution"
                type="number"
                min="0.01"
                step="0.01"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsContributeModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleContribute}
              disabled={
                isSubmitting ||
                !contributionAmount ||
                isNaN(parseFloat(contributionAmount)) ||
                parseFloat(contributionAmount) <= 0
              }
            >
              {isSubmitting ? "Procesando..." : "Contribuir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              tu meta de ahorro y su progreso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isSubmitting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
