import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

    // Convertir a CSV
    const headers = [
      "Fecha",
      "Descripción",
      "Tipo",
      "Categoría",
      "Monto",
      "Recurrencia",
      "Notas",
    ].join(",");

    const csvRows = transactions.map((transaction) => {
      const formattedDate = format(new Date(transaction.date), "dd/MM/yyyy", {
        locale: es,
      });
      const typeLabel = transaction.type === "income" ? "Ingreso" : "Gasto";
      const recurrenceLabel = getRecurrenceLabel(transaction.recurrence);

      return [
        formattedDate,
        `"${transaction.description}"`, // Comillas para descripciones con comas
        typeLabel,
        `"${transaction.category}"`,
        transaction.amount.toFixed(2),
        recurrenceLabel || "Sin recurrencia",
        `"${transaction.notes || ""}"`,
      ].join(",");
    });

    const csvContent = [headers, ...csvRows].join("\n");

    // Nombre del archivo
    const filename =
      type === "recent"
        ? `transacciones_recientes_${format(new Date(), "yyyy-MM-dd")}.csv`
        : `todas_las_transacciones_${format(new Date(), "yyyy-MM-dd")}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting CSV:", error);
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
