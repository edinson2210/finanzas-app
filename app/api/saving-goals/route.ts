import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";

// GET: Obtener todas las metas de ahorro del usuario
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Usamos "as any" para evitar los errores de TypeScript mientras se regenera el cliente
    const savingGoals = await (prisma as any).savingGoal.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(savingGoals);
  } catch (error) {
    console.error("Error al obtener metas de ahorro:", error);
    return NextResponse.json(
      { error: "Error al obtener metas de ahorro" },
      { status: 500 }
    );
  }
}

// POST: Crear una nueva meta de ahorro
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();

    // Crear la meta de ahorro
    const savingGoal = await (prisma as any).savingGoal.create({
      data: {
        ...data,
        userId,
      },
    });

    // Crear notificación informativa para el usuario
    await (prisma as any).notification.create({
      data: {
        title: "Nueva Meta de Ahorro",
        message: `Has creado una nueva meta de ahorro: "${data.name}" por ${data.targetAmount}.`,
        type: "info",
        reference: savingGoal.id,
        referenceType: "savingGoal",
        userId,
      },
    });

    return NextResponse.json(savingGoal);
  } catch (error) {
    console.error("Error al crear meta de ahorro:", error);
    return NextResponse.json(
      { error: "Error al crear la meta de ahorro" },
      { status: 500 }
    );
  }
}
