import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

// GET: Obtener una notificación específica
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
    const notificationId = params.id;

    const notification = await prisma.notification.findUnique({
      where: {
        id: notificationId,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notificación no encontrada" },
        { status: 404 }
      );
    }

    if (notification.userId !== userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error al obtener notificación:", error);
    return NextResponse.json(
      { error: "Error al obtener la notificación" },
      { status: 500 }
    );
  }
}

// PATCH: Actualizar una notificación (marcar como leída/no leída)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const notificationId = params.id;
    const data = await request.json();

    // Verificar que la notificación existe y pertenece al usuario
    const existingNotification = await prisma.notification.findUnique({
      where: {
        id: notificationId,
      },
    });

    if (!existingNotification) {
      return NextResponse.json(
        { error: "Notificación no encontrada" },
        { status: 404 }
      );
    }

    if (existingNotification.userId !== userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Actualizar la notificación
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: data,
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error al actualizar notificación:", error);
    return NextResponse.json(
      { error: "Error al actualizar la notificación" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una notificación
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
    const notificationId = params.id;

    // Verificar que la notificación existe y pertenece al usuario
    const existingNotification = await prisma.notification.findUnique({
      where: {
        id: notificationId,
      },
    });

    if (!existingNotification) {
      return NextResponse.json(
        { error: "Notificación no encontrada" },
        { status: 404 }
      );
    }

    if (existingNotification.userId !== userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Eliminar la notificación
    await prisma.notification.delete({
      where: {
        id: notificationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar notificación:", error);
    return NextResponse.json(
      { error: "Error al eliminar la notificación" },
      { status: 500 }
    );
  }
}
