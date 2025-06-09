import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // all, recent (últimos 3 meses)

    let whereClause: any = {
      userId: session.user.id,
    };

    // Si es "recent", filtrar por últimos 3 meses
    if (type === "recent") {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      whereClause.date = {
        gte: threeMonthsAgo,
      };
    }

    // Obtener transacciones
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
    });

    // Crear PDF
    const doc = new jsPDF();

    // Título del documento
    const title =
      type === "recent"
        ? "Transacciones Recientes (Últimos 3 Meses)"
        : "Reporte de Todas las Transacciones";

    doc.setFontSize(18);
    doc.text(title, 20, 20);

    // Fecha de generación
    doc.setFontSize(10);
    doc.text(
      `Generado el: ${format(new Date(), "dd/MM/yyyy", { locale: es })}`,
      20,
      30
    );

    // Calcular totales
    const totalIngresos = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalGastos = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIngresos - totalGastos;

    // Mostrar resumen
    doc.setFontSize(12);
    doc.text("Resumen:", 20, 45);
    doc.setFontSize(10);
    doc.text(`Total de Ingresos: $${totalIngresos.toFixed(2)}`, 20, 55);
    doc.text(`Total de Gastos: $${totalGastos.toFixed(2)}`, 20, 65);
    doc.text(`Balance: $${balance.toFixed(2)}`, 20, 75);

    // Preparar datos para la tabla
    const tableData = transactions.map((transaction) => [
      format(new Date(transaction.date), "dd/MM/yyyy", { locale: es }),
      transaction.description,
      transaction.type === "income" ? "Ingreso" : "Gasto",
      transaction.category,
      `$${transaction.amount.toFixed(2)}`,
      getRecurrenceLabel(transaction.recurrence) || "-",
    ]);

    // Crear tabla
    autoTable(doc, {
      startY: 85,
      head: [
        ["Fecha", "Descripción", "Tipo", "Categoría", "Monto", "Recurrencia"],
      ],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: {
        fillColor: [63, 131, 248], // Color azul
        textColor: 255,
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Fecha
        1: { cellWidth: 45 }, // Descripción
        2: { cellWidth: 20 }, // Tipo
        3: { cellWidth: 35 }, // Categoría
        4: { cellWidth: 25 }, // Monto
        5: { cellWidth: 25 }, // Recurrencia
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
    });

    // Agregar información del pie de página
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width - 40,
        doc.internal.pageSize.height - 10
      );
    }

    // Generar el PDF como buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // Nombre del archivo
    const filename =
      type === "recent"
        ? `transacciones_recientes_${format(new Date(), "yyyy-MM-dd")}.pdf`
        : `todas_las_transacciones_${format(new Date(), "yyyy-MM-dd")}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting PDF:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

// Función auxiliar para obtener etiquetas de recurrencia
function getRecurrenceLabel(recurrence: string | null): string {
  if (!recurrence || recurrence === "none") return "";

  const labels: Record<string, string> = {
    daily: "Diaria",
    weekly: "Semanal",
    biweekly: "Quincenal",
    monthly: "Mensual",
    quarterly: "Trimestral",
    yearly: "Anual",
  };

  return labels[recurrence] || "";
}
