"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useFinance } from "@/context/finance-context";
import {
  CirclePlus,
  Edit,
  Filter,
  Trash2,
  ArrowLeft,
  Plus,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

export default function CategoriesPage() {
  const router = useRouter();
  const { state, dispatch, fetchAllData } = useFinance();
  const { status } = useSession();
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);

  // Estados para el formulario de categoría
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("CircleDollarSign");
  const [color, setColor] = useState("#3b82f6");
  const [type, setType] = useState("expense");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Redirigir si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Filtrar categorías cuando cambian los filtros
  useEffect(() => {
    let result = [...state.categories];

    if (searchTerm) {
      result = result.filter((cat) =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "all") {
      result = result.filter((cat) => cat.type === filterType);
    }

    result.sort((a, b) => a.name.localeCompare(b.name));
    setFilteredCategories(result);
  }, [searchTerm, filterType, state.categories]);

  // Función para crear una nueva categoría
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validaciones
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "El nombre es obligatorio";
    if (!icon.trim()) newErrors.icon = "El ícono es obligatorio";
    if (!color.trim()) newErrors.color = "El color es obligatorio";
    if (!type) newErrors.type = "El tipo es obligatorio";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          icon,
          color,
          type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear la categoría");
      }

      // Recargar datos después de crear
      await fetchAllData();

      // Limpiar formulario y cerrar modal
      setName("");
      setIcon("CircleDollarSign");
      setColor("#3b82f6");
      setType("expense");
      setIsCreateOpen(false);
    } catch (error: any) {
      console.error("Error:", error);
      dispatch({
        type: "SET_ERROR",
        payload: error.message || "Error al crear la categoría",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para abrir el modal de edición
  const handleEditClick = (category: any) => {
    setCategoryId(category.id);
    setName(category.name);
    setIcon(category.icon);
    setColor(category.color);
    setType(category.type);
    setIsEditOpen(true);
  };

  // Función para actualizar una categoría
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validaciones
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "El nombre es obligatorio";
    if (!icon.trim()) newErrors.icon = "El ícono es obligatorio";
    if (!color.trim()) newErrors.color = "El color es obligatorio";
    if (!type) newErrors.type = "El tipo es obligatorio";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/categories", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: categoryId,
          name: name.trim(),
          icon,
          color,
          type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar la categoría");
      }

      // Recargar datos después de actualizar
      await fetchAllData();

      // Limpiar formulario y cerrar modal
      resetForm();
      setIsEditOpen(false);
    } catch (error: any) {
      console.error("Error:", error);
      dispatch({
        type: "SET_ERROR",
        payload: error.message || "Error al actualizar la categoría",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para abrir el modal de eliminar
  const handleDeleteClick = (category: any) => {
    setCategoryId(category.id);
    setName(category.name);
    setDeleteError("");
    setIsDeleteOpen(true);
  };

  // Función para eliminar una categoría
  const handleDeleteCategory = async () => {
    setIsSubmitting(true);
    setDeleteError("");

    try {
      const response = await fetch(`/api/categories?id=${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.transactionsCount) {
          setDeleteError(
            `Esta categoría está siendo utilizada en ${errorData.transactionsCount} transacciones y no puede ser eliminada.`
          );
          return;
        }
        throw new Error(errorData.error || "Error al eliminar la categoría");
      }

      // Recargar datos después de eliminar
      await fetchAllData();

      // Limpiar y cerrar modal
      resetForm();
      setIsDeleteOpen(false);
    } catch (error: any) {
      console.error("Error:", error);
      setDeleteError(error.message || "Error al eliminar la categoría");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para resetear el formulario
  const resetForm = () => {
    setCategoryId("");
    setName("");
    setIcon("CircleDollarSign");
    setColor("#3b82f6");
    setType("expense");
    setErrors({});
  };

  // Mostrar indicador de carga mientras se verifica la sesión
  if (status === "loading" || state.isLoading) {
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
            Gestión de Categorías
          </h1>
        </div>

        {state.error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 dark:bg-red-900/30">
            {state.error}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="income">Ingresos</SelectItem>
                  <SelectItem value="expense">Gastos</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Input
              placeholder="Buscar categoría..."
              className="w-full md:w-auto max-w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Dialog
            open={isCreateOpen}
            onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Categoría
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Categoría</DialogTitle>
                <DialogDescription>
                  Agrega una nueva categoría para clasificar tus transacciones.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCategory}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Nombre <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="icon">
                      Ícono <span className="text-red-500">*</span>
                    </Label>
                    <Select value={icon} onValueChange={setIcon}>
                      <SelectTrigger
                        id="icon"
                        className={errors.icon ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Selecciona un ícono" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Home">Casa</SelectItem>
                        <SelectItem value="ShoppingCart">Compras</SelectItem>
                        <SelectItem value="Car">Transporte</SelectItem>
                        <SelectItem value="Zap">Servicios</SelectItem>
                        <SelectItem value="Film">Entretenimiento</SelectItem>
                        <SelectItem value="Briefcase">Trabajo</SelectItem>
                        <SelectItem value="TrendingUp">Inversiones</SelectItem>
                        <SelectItem value="ShoppingBag">Ventas</SelectItem>
                        <SelectItem value="CircleDollarSign">Dinero</SelectItem>
                        <SelectItem value="CreditCard">Tarjeta</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.icon && (
                      <p className="text-red-500 text-sm">{errors.icon}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">
                      Color <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className={`w-12 h-10 p-1 ${
                          errors.color ? "border-red-500" : ""
                        }`}
                      />
                      <div
                        className="w-10 h-10 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                    {errors.color && (
                      <p className="text-red-500 text-sm">{errors.color}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">
                      Tipo <span className="text-red-500">*</span>
                    </Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger
                        id="type"
                        className={errors.type ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Ingreso</SelectItem>
                        <SelectItem value="expense">Gasto</SelectItem>
                        <SelectItem value="both">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-red-500 text-sm">{errors.type}</p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creando..." : "Crear Categoría"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Modal de Edición */}
        <Dialog
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Categoría</DialogTitle>
              <DialogDescription>
                Modifica los datos de la categoría.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateCategory}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-icon">
                    Ícono <span className="text-red-500">*</span>
                  </Label>
                  <Select value={icon} onValueChange={setIcon}>
                    <SelectTrigger
                      id="edit-icon"
                      className={errors.icon ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Selecciona un ícono" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Home">Casa</SelectItem>
                      <SelectItem value="ShoppingCart">Compras</SelectItem>
                      <SelectItem value="Car">Transporte</SelectItem>
                      <SelectItem value="Zap">Servicios</SelectItem>
                      <SelectItem value="Film">Entretenimiento</SelectItem>
                      <SelectItem value="Briefcase">Trabajo</SelectItem>
                      <SelectItem value="TrendingUp">Inversiones</SelectItem>
                      <SelectItem value="ShoppingBag">Ventas</SelectItem>
                      <SelectItem value="CircleDollarSign">Dinero</SelectItem>
                      <SelectItem value="CreditCard">Tarjeta</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.icon && (
                    <p className="text-red-500 text-sm">{errors.icon}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-color">
                    Color <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="edit-color"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className={`w-12 h-10 p-1 ${
                        errors.color ? "border-red-500" : ""
                      }`}
                    />
                    <div
                      className="w-10 h-10 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                  {errors.color && (
                    <p className="text-red-500 text-sm">{errors.color}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-type">
                    Tipo <span className="text-red-500">*</span>
                  </Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger
                      id="edit-type"
                      className={errors.type ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Ingreso</SelectItem>
                      <SelectItem value="expense">Gasto</SelectItem>
                      <SelectItem value="both">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-red-500 text-sm">{errors.type}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Actualizando..." : "Actualizar Categoría"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Diálogo de confirmación para eliminar */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La categoría "{name}" será
                eliminada permanentemente.
              </AlertDialogDescription>
              {deleteError && (
                <div className="mt-3 flex items-center gap-2 p-3 text-sm text-red-500 bg-red-50 rounded-md dark:bg-red-900/30">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{deleteError}</span>
                </div>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => resetForm()}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCategory}
                disabled={isSubmitting}
                className="bg-red-500 hover:bg-red-600"
              >
                {isSubmitting ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Card>
          <CardHeader>
            <CardTitle>Categorías</CardTitle>
            <CardDescription>
              Administra las categorías para clasificar tus transacciones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCategories.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell>
                        {category.type === "income"
                          ? "Ingreso"
                          : category.type === "expense"
                          ? "Gasto"
                          : "Ambos"}
                      </TableCell>
                      <TableCell>
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar categoría"
                            onClick={() => handleEditClick(category)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Eliminar categoría"
                            onClick={() => handleDeleteClick(category)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  No se encontraron categorías{" "}
                  {filterType !== "all" ? `de tipo ${filterType}` : ""}{" "}
                  {searchTerm ? `que coincidan con "${searchTerm}"` : ""}.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
