import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";

// GET: Obtener todas las transacciones del usuario autenticado
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error al obtener transacciones:", error);
    return NextResponse.json(
      { error: "Error al obtener transacciones" },
      { status: 500 }
    );
  }
}

// POST: Crear una nueva transacción
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();

    // Validaciones básicas
    if (
      !data.description ||
      !data.amount ||
      !data.date ||
      !data.type ||
      !data.category
    ) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        description: data.description,
        amount: parseFloat(data.amount),
        date: new Date(data.date),
        type: data.type,
        category: data.category,
        recurrence: data.recurrence || "none",
        notes: data.notes || "",
        userId: userId,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error al crear transacción:", error);
    return NextResponse.json(
      { error: "Error al crear la transacción" },
      { status: 500 }
    );
  }
}
