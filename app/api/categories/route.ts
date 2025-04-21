import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";

// GET: Obtener todas las categorías del usuario
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    const categories = await prisma.category.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return NextResponse.json(
      { error: "Error al obtener categorías" },
      { status: 500 }
    );
  }
}

// POST: Crear una nueva categoría
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();

    // Validaciones básicas
    if (!data.name || !data.icon || !data.color || !data.type) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Verificar si ya existe una categoría con el mismo nombre para este usuario
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: data.name,
        userId: userId,
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Ya existe una categoría con este nombre" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        icon: data.icon,
        color: data.color,
        type: data.type,
        userId: userId,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error al crear categoría:", error);
    return NextResponse.json(
      { error: "Error al crear la categoría" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar una categoría existente
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();

    // Validaciones básicas
    if (!data.id || !data.name || !data.icon || !data.color || !data.type) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Verificar si la categoría existe y pertenece al usuario
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: data.id,
        userId: userId,
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si ya existe otra categoría con el mismo nombre
    if (data.name !== existingCategory.name) {
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          name: data.name,
          userId: userId,
          NOT: {
            id: data.id,
          },
        },
      });

      if (duplicateCategory) {
        return NextResponse.json(
          { error: "Ya existe una categoría con este nombre" },
          { status: 400 }
        );
      }
    }

    // Actualizar la categoría
    const updatedCategory = await prisma.category.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        icon: data.icon,
        color: data.color,
        type: data.type,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
    return NextResponse.json(
      { error: "Error al actualizar la categoría" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una categoría
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("id");

    if (!categoryId) {
      return NextResponse.json(
        { error: "ID de categoría no proporcionado" },
        { status: 400 }
      );
    }

    // Verificar si la categoría existe y pertenece al usuario
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: userId,
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si la categoría está siendo utilizada en transacciones
    const transactionsUsingCategory = await prisma.transaction.count({
      where: {
        userId: userId,
        category: existingCategory.name,
      },
    });

    if (transactionsUsingCategory > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar esta categoría porque está siendo utilizada en transacciones",
          transactionsCount: transactionsUsingCategory,
        },
        { status: 400 }
      );
    }

    // Eliminar la categoría
    await prisma.category.delete({
      where: {
        id: categoryId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    return NextResponse.json(
      { error: "Error al eliminar la categoría" },
      { status: 500 }
    );
  }
}
