import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getPendingRecurrentTransactions } from "@/lib/recurrence-utils";

// POST: Generar transacciones recurrentes pendientes
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Obtener todas las transacciones del usuario
    const allTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    // Filtrar las transacciones que tienen recurrencia
    const recurringTransactions = allTransactions.filter(
      (t) => t.recurrence && t.recurrence !== "none"
    );

    // Obtener las transacciones pendientes que deberían generarse
    const pendingTransactions = getPendingRecurrentTransactions(
      recurringTransactions,
      allTransactions,
      new Date()
    );

    // Crear las transacciones pendientes en la base de datos
    const createdTransactions = [];
    for (const pending of pendingTransactions) {
      // Verificar que no exista ya una transacción idéntica en esa fecha
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          userId: userId,
          description: pending.description,
          amount: pending.amount,
          date: new Date(pending.date),
          type: pending.type,
          category: pending.category,
          recurrence: pending.recurrence,
        },
      });

      // Solo crear si no existe una transacción idéntica
      if (!existingTransaction) {
        const newTransaction = await prisma.transaction.create({
          data: {
            description: pending.description,
            amount: pending.amount,
            date: new Date(pending.date),
            type: pending.type,
            category: pending.category,
            recurrence: pending.recurrence,
            notes: pending.notes || "",
            userId: userId,
          },
        });
        createdTransactions.push(newTransaction);
      }
    }

    return NextResponse.json({
      message: `Se generaron ${createdTransactions.length} transacciones recurrentes`,
      created: createdTransactions.length,
      transactions: createdTransactions,
    });
  } catch (error) {
    console.error("Error al generar transacciones recurrentes:", error);
    return NextResponse.json(
      { error: "Error al generar transacciones recurrentes" },
      { status: 500 }
    );
  }
}

// GET: Obtener las transacciones recurrentes pendientes sin crearlas
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Obtener todas las transacciones del usuario
    const allTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    // Filtrar las transacciones que tienen recurrencia
    const recurringTransactions = allTransactions.filter(
      (t) => t.recurrence && t.recurrence !== "none"
    );

    // Obtener las transacciones pendientes que deberían generarse
    const pendingTransactions = getPendingRecurrentTransactions(
      recurringTransactions,
      allTransactions,
      new Date()
    );

    return NextResponse.json({
      pending: pendingTransactions.length,
      transactions: pendingTransactions,
    });
  } catch (error) {
    console.error("Error al obtener transacciones recurrentes:", error);
    return NextResponse.json(
      { error: "Error al obtener transacciones recurrentes" },
      { status: 500 }
    );
  }
}
