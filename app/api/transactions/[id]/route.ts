import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

// GET: Obtener una transacción específica
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const transactionId = params.id;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: userId,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transacción no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error al obtener transacción:", error);
    return NextResponse.json(
      { error: "Error al obtener la transacción" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar una transacción existente
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const transactionId = params.id;
    const data = await request.json();

    // Verificar que la transacción pertenece al usuario
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: userId,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transacción no encontrada" },
        { status: 404 }
      );
    }

    // Actualizar la transacción
    const updatedTransaction = await prisma.transaction.update({
      where: {
        id: transactionId,
      },
      data: {
        description: data.description,
        amount: data.amount ? parseFloat(data.amount) : undefined,
        date: data.date ? new Date(data.date) : undefined,
        type: data.type,
        category: data.category,
        recurrence: data.recurrence,
        notes: data.notes,
      },
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error("Error al actualizar transacción:", error);
    return NextResponse.json(
      { error: "Error al actualizar la transacción" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una transacción
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const transactionId = params.id;

    // Verificar que la transacción pertenece al usuario
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: userId,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transacción no encontrada" },
        { status: 404 }
      );
    }

    // Eliminar la transacción
    await prisma.transaction.delete({
      where: {
        id: transactionId,
      },
    });

    return NextResponse.json(
      { message: "Transacción eliminada correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar transacción:", error);
    return NextResponse.json(
      { error: "Error al eliminar la transacción" },
      { status: 500 }
    );
  }
}
