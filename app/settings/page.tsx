"use client";

import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState("csv");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type: "all" | "recent") => {
    setIsExporting(true);

    try {
      const endpoint =
        exportFormat === "csv" ? "/api/export/csv" : "/api/export/pdf";
      const response = await fetch(`${endpoint}?type=${type}`);

      if (!response.ok) {
        throw new Error("Error al exportar los datos");
      }

      // Crear enlace de descarga
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Obtener nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename =
        contentDisposition?.match(/filename="(.+)"/)?.[1] ||
        `transacciones_${type}_${
          new Date().toISOString().split("T")[0]
        }.${exportFormat}`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Exportación exitosa",
        description: `Los datos se han exportado correctamente en formato ${exportFormat.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Error al exportar:", error);
      toast({
        title: "Error",
        description: "No se pudieron exportar los datos. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>
                Configura alertas y recordatorios.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="payment-reminder">
                    Recordatorios de Pago
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe alertas antes de la fecha de vencimiento
                  </p>
                </div>
                <Switch id="payment-reminder" defaultChecked />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder-days">Días de Anticipación</Label>
                <Select defaultValue="3">
                  <SelectTrigger id="reminder-days">
                    <SelectValue placeholder="Selecciona los días" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 día antes</SelectItem>
                    <SelectItem value="3">3 días antes</SelectItem>
                    <SelectItem value="5">5 días antes</SelectItem>
                    <SelectItem value="7">7 días antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="budget-alert">Alertas de Presupuesto</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar cuando te acerques al límite
                  </p>
                </div>
                <Switch id="budget-alert" defaultChecked />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget-threshold">Umbral de Alerta</Label>
                <Select defaultValue="80">
                  <SelectTrigger id="budget-threshold">
                    <SelectValue placeholder="Selecciona el umbral" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="70">70% del presupuesto</SelectItem>
                    <SelectItem value="80">80% del presupuesto</SelectItem>
                    <SelectItem value="90">90% del presupuesto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exportación de Datos</CardTitle>
              <CardDescription>
                Opciones para exportar tus datos financieros.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="export-format">Formato de Exportación</Label>
                <RadioGroup
                  value={exportFormat}
                  onValueChange={setExportFormat}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="csv" />
                    <Label htmlFor="csv">CSV (Excel, Google Sheets)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pdf" id="pdf" />
                    <Label htmlFor="pdf">PDF (Documento)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="pt-4 space-y-2">
                <Button
                  className="w-full"
                  onClick={() => handleExport("all")}
                  disabled={isExporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isExporting ? "Exportando..." : "Exportar Todos los Datos"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleExport("recent")}
                  disabled={isExporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isExporting ? "Exportando..." : "Exportar Últimos 3 Meses"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
