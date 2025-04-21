import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";

// GET: Obtener la configuración del usuario
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Buscar la configuración actual del usuario
    let settings = await prisma.settings.findUnique({
      where: {
        userId: userId,
      },
    });

    // Si no existe, crear una configuración predeterminada
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          userId: userId,
          // Los valores predeterminados se establecerán automáticamente según el esquema
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    return NextResponse.json(
      { error: "Error al obtener la configuración" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar la configuración del usuario
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();

    // Verificar que el usuario tiene una configuración
    const existingSettings = await prisma.settings.findUnique({
      where: {
        userId: userId,
      },
    });

    // Si no existe, crearla; si existe, actualizarla
    let settings;
    if (!existingSettings) {
      settings = await prisma.settings.create({
        data: {
          ...data,
          userId: userId,
        },
      });
    } else {
      settings = await prisma.settings.update({
        where: {
          userId: userId,
        },
        data: data,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    return NextResponse.json(
      { error: "Error al actualizar la configuración" },
      { status: 500 }
    );
  }
}
