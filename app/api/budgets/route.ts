import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";

// GET: Obtener todos los presupuestos del usuario autenticado
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    const budgets = await prisma.budget.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        category: "asc",
      },
    });

    return NextResponse.json(budgets);
  } catch (error) {
    console.error("Error al obtener presupuestos:", error);
    return NextResponse.json(
      { error: "Error al obtener presupuestos" },
      { status: 500 }
    );
  }
}

// POST: Crear un nuevo presupuesto
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();

    // Validaciones básicas
    if (!data.category || !data.amount || !data.period) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Verificar si ya existe un presupuesto para esta categoría
    const existingBudget = await prisma.budget.findFirst({
      where: {
        userId: userId,
        category: data.category,
      },
    });

    if (existingBudget) {
      return NextResponse.json(
        { error: "Ya existe un presupuesto para esta categoría" },
        { status: 400 }
      );
    }

    // Verificar que la categoría existe
    const categoryExists = await prisma.category.findFirst({
      where: {
        userId: userId,
        name: data.category,
      },
    });

    if (!categoryExists) {
      return NextResponse.json(
        { error: "La categoría no existe" },
        { status: 400 }
      );
    }

    // Crear el presupuesto
    const budget = await prisma.budget.create({
      data: {
        category: data.category,
        amount: parseFloat(data.amount),
        period: data.period,
        spent: data.spent ? parseFloat(data.spent) : 0,
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("Error al crear presupuesto:", error);
    return NextResponse.json(
      { error: "Error al crear el presupuesto" },
      { status: 500 }
    );
  }
}
