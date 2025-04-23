import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

// POST: Marcar todas las notificaciones como leídas
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Actualizar todas las notificaciones del usuario a "read"
    const result = await prisma.notification.updateMany({
      where: {
        userId: userId,
        status: "unread",
      },
      data: {
        status: "read",
      },
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
    });
  } catch (error) {
    console.error("Error al marcar notificaciones como leídas:", error);
    return NextResponse.json(
      { error: "Error al marcar notificaciones como leídas" },
      { status: 500 }
    );
  }
}
