import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

// GET: Obtener un presupuesto por ID
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
    const budgetId = params.id;

    // Verificar que el presupuesto pertenece al usuario
    const budget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId: userId,
      },
    });

    if (!budget) {
      return NextResponse.json(
        { error: "Presupuesto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(budget);
  } catch (error) {
    console.error("Error al obtener presupuesto:", error);
    return NextResponse.json(
      { error: "Error al obtener el presupuesto" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar un presupuesto existente
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
    const budgetId = params.id;
    const data = await request.json();

    // Verificar que el presupuesto pertenece al usuario
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId: userId,
      },
    });

    if (!existingBudget) {
      return NextResponse.json(
        { error: "Presupuesto no encontrado" },
        { status: 404 }
      );
    }

    // Si se cambia la categoría, verificar que no exista otro presupuesto con esa categoría
    if (data.category && data.category !== existingBudget.category) {
      const categoryExists = await prisma.budget.findFirst({
        where: {
          userId: userId,
          category: data.category,
          NOT: {
            id: budgetId,
          },
        },
      });

      if (categoryExists) {
        return NextResponse.json(
          { error: "Ya existe un presupuesto para esta categoría" },
          { status: 400 }
        );
      }
    }

    // Actualizar el presupuesto
    const updatedBudget = await prisma.budget.update({
      where: {
        id: budgetId,
      },
      data: {
        category: data.category,
        amount: data.amount ? parseFloat(data.amount) : undefined,
        period: data.period,
        spent: data.spent ? parseFloat(data.spent) : undefined,
      },
    });

    return NextResponse.json(updatedBudget);
  } catch (error) {
    console.error("Error al actualizar presupuesto:", error);
    return NextResponse.json(
      { error: "Error al actualizar el presupuesto" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un presupuesto existente
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
    const budgetId = params.id;

    // Verificar que el presupuesto pertenece al usuario
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId: userId,
      },
    });

    if (!existingBudget) {
      return NextResponse.json(
        { error: "Presupuesto no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el presupuesto
    await prisma.budget.delete({
      where: {
        id: budgetId,
      },
    });

    return NextResponse.json({ message: "Presupuesto eliminado con éxito" });
  } catch (error) {
    console.error("Error al eliminar presupuesto:", error);
    return NextResponse.json(
      { error: "Error al eliminar el presupuesto" },
      { status: 500 }
    );
  }
}
