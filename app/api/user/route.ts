import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";

// GET: Obtener datos del perfil del usuario actual
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Obtener el usuario desde la base de datos con información completa
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        // No incluir contraseña por seguridad
        _count: {
          select: {
            transactions: true,
            categories: true,
            budgets: true,
            debts: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error al obtener perfil de usuario:", error);
    return NextResponse.json(
      { error: "Error al obtener el perfil de usuario" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar perfil del usuario
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();

    // Asegurarse de que no se puedan actualizar campos sensibles
    const { password, role, id, ...updateData } = data;

    // Actualizar el usuario
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error al actualizar perfil de usuario:", error);
    return NextResponse.json(
      { error: "Error al actualizar el perfil de usuario" },
      { status: 500 }
    );
  }
}
