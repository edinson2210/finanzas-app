import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

// GET: Obtener una meta de ahorro específica
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
    const goalId = params.id;

    const savingGoal = await (prisma as any).savingGoal.findUnique({
      where: {
        id: goalId,
      },
    });

    if (!savingGoal) {
      return NextResponse.json(
        { error: "Meta de ahorro no encontrada" },
        { status: 404 }
      );
    }

    if (savingGoal.userId !== userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    return NextResponse.json(savingGoal);
  } catch (error) {
    console.error("Error al obtener meta de ahorro:", error);
    return NextResponse.json(
      { error: "Error al obtener la meta de ahorro" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar una meta de ahorro
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
    const goalId = params.id;
    const data = await request.json();

    // Verificar que la meta existe y pertenece al usuario
    const existingGoal = await (prisma as any).savingGoal.findUnique({
      where: {
        id: goalId,
      },
    });

    if (!existingGoal) {
      return NextResponse.json(
        { error: "Meta de ahorro no encontrada" },
        { status: 404 }
      );
    }

    if (existingGoal.userId !== userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Si se actualizó el monto actual y se completó la meta
    const wasCompleted =
      data.currentAmount &&
      data.currentAmount >= existingGoal.targetAmount &&
      existingGoal.status !== "completed";

    // Actualizar la meta
    const savingGoal = await (prisma as any).savingGoal.update({
      where: {
        id: goalId,
      },
      data: {
        ...data,
        // Actualizar automáticamente el estado a "completed" si se alcanzó el objetivo
        ...(wasCompleted && { status: "completed" }),
      },
    });

    // Si se completó la meta, crear una notificación
    if (wasCompleted) {
      await (prisma as any).notification.create({
        data: {
          title: "¡Meta de Ahorro Completada!",
          message: `¡Felicidades! Has completado tu meta de ahorro "${existingGoal.name}".`,
          type: "info",
          reference: goalId,
          referenceType: "savingGoal",
          userId,
        },
      });
    }

    return NextResponse.json(savingGoal);
  } catch (error) {
    console.error("Error al actualizar meta de ahorro:", error);
    return NextResponse.json(
      { error: "Error al actualizar la meta de ahorro" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una meta de ahorro
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
    const goalId = params.id;

    // Verificar que la meta existe y pertenece al usuario
    const existingGoal = await (prisma as any).savingGoal.findUnique({
      where: {
        id: goalId,
      },
    });

    if (!existingGoal) {
      return NextResponse.json(
        { error: "Meta de ahorro no encontrada" },
        { status: 404 }
      );
    }

    if (existingGoal.userId !== userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Eliminar la meta
    await (prisma as any).savingGoal.delete({
      where: {
        id: goalId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar meta de ahorro:", error);
    return NextResponse.json(
      { error: "Error al eliminar la meta de ahorro" },
      { status: 500 }
    );
  }
}
