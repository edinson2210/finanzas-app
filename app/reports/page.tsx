"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  isWithinInterval,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Download,
  Filter,
  FileText,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFinance } from "@/context/finance-context";
import { Transaction } from "@/context/finance-context";

export default function ReportsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { state } = useFinance();
  const { toast } = useToast();

  // Filter states
  const [reportType, setReportType] = useState<
    "all" | "income" | "expense" | "category"
  >("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [dateRange, setDateRange] = useState<
    "month" | "quarter" | "year" | "custom"
  >("month");
  const [fromDate, setFromDate] = useState<Date>(subMonths(new Date(), 1));
  const [toDate, setToDate] = useState<Date>(new Date());

  // Report data
  const [reportData, setReportData] = useState<Transaction[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Handle date range selection
  useEffect(() => {
    const now = new Date();

    switch (dateRange) {
      case "month":
        setFromDate(startOfMonth(now));
        setToDate(endOfMonth(now));
        break;
      case "quarter":
        setFromDate(subMonths(now, 3));
        setToDate(now);
        break;
      case "year":
        setFromDate(subMonths(now, 12));
        setToDate(now);
        break;
      // For custom, we don't update the dates as user will select them
    }
  }, [dateRange]);

  // Get unique categories from transactions
  const categories = [
    ...new Set(state.transactions.map((t) => t.category)),
  ].sort();

  // Generate report based on filters
  const generateReport = () => {
    setIsGenerating(true);

    // Filter transactions by date range
    let filtered = state.transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return isWithinInterval(transactionDate, {
        start: fromDate,
        end: toDate,
      });
    });

    // Apply type filter
    if (reportType === "income") {
      filtered = filtered.filter((t) => t.type === "income");
    } else if (reportType === "expense") {
      filtered = filtered.filter((t) => t.type === "expense");
    }

    // Apply category filter if needed
    if (reportType === "category" && selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Sort by date (newest first)
    filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setReportData(filtered);
    setIsGenerating(false);

    toast({
      title: "Informe generado",
      description: `Se encontraron ${filtered.length} transacciones en el período seleccionado.`,
    });
  };

  // Function to export data as CSV
  const exportToCSV = () => {
    if (reportData.length === 0) {
      toast({
        title: "No hay datos para exportar",
        description: "Genera un informe primero antes de exportar.",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const headers = [
      "Fecha",
      "Descripción",
      "Categoría",
      "Tipo",
      "Monto",
      "Notas",
    ];

    const csvContent = [
      headers.join(","),
      ...reportData.map((t) =>
        [
          format(new Date(t.date), "yyyy-MM-dd"),
          `"${t.description.replace(/"/g, '""')}"`,
          `"${t.category.replace(/"/g, '""')}"`,
          t.type === "income" ? "Ingreso" : "Gasto",
          t.amount.toString(),
          `"${(t.notes || "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `reporte-financiero-${format(fromDate, "yyyy-MM-dd")}-a-${format(
        toDate,
        "yyyy-MM-dd"
      )}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportación completada",
      description: "El archivo CSV ha sido descargado.",
    });
  };

  // Function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PA", {
      style: "currency",
      currency: state.settings.currency || "USD",
    }).format(amount);
  };

  // Calculate report summary
  const reportSummary = {
    total: reportData.reduce(
      (sum, t) => (t.type === "income" ? sum + t.amount : sum - t.amount),
      0
    ),
    income: reportData
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0),
    expense: reportData
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0),
    count: reportData.length,
  };

  // If loading or not authenticated, show loading state
  if (status === "loading" || state.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Informes Financieros</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Configurar Informe</CardTitle>
          <CardDescription>
            Selecciona las opciones para generar tu informe financiero
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="mb-2 block">Tipo de Informe</Label>
              <RadioGroup
                value={reportType}
                onValueChange={(value) =>
                  setReportType(
                    value as "all" | "income" | "expense" | "category"
                  )
                }
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">Todas las transacciones</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="income" />
                  <Label htmlFor="income">Solo ingresos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="expense" />
                  <Label htmlFor="expense">Solo gastos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="category" id="category" />
                  <Label htmlFor="category">Por categoría</Label>
                </div>
              </RadioGroup>

              {reportType === "category" && (
                <div className="mt-4">
                  <Label htmlFor="category-select" className="mb-2 block">
                    Selecciona una categoría
                  </Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger id="category-select">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label className="mb-2 block">Período</Label>
              <RadioGroup
                value={dateRange}
                onValueChange={(value) =>
                  setDateRange(value as "month" | "quarter" | "year" | "custom")
                }
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="month" id="month" />
                  <Label htmlFor="month">Mes actual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="quarter" id="quarter" />
                  <Label htmlFor="quarter">Últimos 3 meses</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="year" id="year" />
                  <Label htmlFor="year">Últimos 12 meses</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom">Personalizado</Label>
                </div>
              </RadioGroup>

              {dateRange === "custom" && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label className="mb-2 block">Desde</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(fromDate, "PPP", { locale: es })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={fromDate}
                          onSelect={(date) => date && setFromDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label className="mb-2 block">Hasta</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(toDate, "PPP", { locale: es })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={toDate}
                          onSelect={(date) => date && setToDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Cancelar
          </Button>
          <Button onClick={generateReport} disabled={isGenerating}>
            {isGenerating ? "Generando..." : "Generar Informe"}
          </Button>
        </CardFooter>
      </Card>

      {reportData.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-medium">Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    reportSummary.total >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(reportSummary.total)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total para el período seleccionado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-medium">Ingresos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(reportSummary.income)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {reportData.filter((t) => t.type === "income").length}{" "}
                  transacciones
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-medium">Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(reportSummary.expense)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {reportData.filter((t) => t.type === "expense").length}{" "}
                  transacciones
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Transacciones del Informe</CardTitle>
                <CardDescription>
                  Período: {format(fromDate, "dd MMM yyyy", { locale: es })} -{" "}
                  {format(toDate, "dd MMM yyyy", { locale: es })}
                </CardDescription>
              </div>
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="ml-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>
                  Total: {reportData.length} transacciones encontradas
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(new Date(transaction.date), "dd MMM yyyy", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.description}
                      </TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>
                        {transaction.type === "income" ? "Ingreso" : "Gasto"}
                      </TableCell>
                      <TableCell
                        className={`text-right ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
