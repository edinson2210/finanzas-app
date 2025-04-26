import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";

// GET: Obtener todas las deudas del usuario autenticado
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    const debts = await prisma.debt.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        nextPaymentDate: "asc",
      },
    });

    // Convertir linkedTransactions de JSON string a array
    const processedDebts = debts.map((debt) => ({
      ...debt,
      linkedTransactions: debt.linkedTransactions
        ? JSON.parse(debt.linkedTransactions)
        : [],
    }));

    return NextResponse.json(processedDebts);
  } catch (error) {
    console.error("Error al obtener deudas:", error);
    return NextResponse.json(
      { error: "Error al obtener deudas" },
      { status: 500 }
    );
  }
}

// POST: Crear una nueva deuda
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();

    // Validaciones básicas
    if (
      !data.description ||
      !data.totalAmount ||
      !data.remainingAmount ||
      !data.monthlyPayment ||
      !data.nextPaymentDate
    ) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Procesar linkedTransactions para almacenar como JSON string
    const linkedTransactionsString = data.linkedTransactions
      ? JSON.stringify(data.linkedTransactions)
      : null;

    const debt = await prisma.debt.create({
      data: {
        description: data.description,
        totalAmount: parseFloat(data.totalAmount),
        remainingAmount: parseFloat(data.remainingAmount),
        monthlyPayment: parseFloat(data.monthlyPayment),
        nextPaymentDate: new Date(data.nextPaymentDate),
        frequency: data.frequency || "monthly",
        creditor: data.creditor || null,
        interestRate: data.interestRate ? parseFloat(data.interestRate) : null,
        interestFrequency: data.interestFrequency || "monthly",
        linkedTransactions: linkedTransactionsString,
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });

    // Devolver la deuda con linkedTransactions como array
    const processedDebt = {
      ...debt,
      linkedTransactions: linkedTransactionsString
        ? JSON.parse(linkedTransactionsString)
        : [],
    };

    return NextResponse.json(processedDebt, { status: 201 });
  } catch (error) {
    console.error("Error al crear deuda:", error);
    return NextResponse.json(
      { error: "Error al crear la deuda" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar una deuda existente
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const debtId = searchParams.get("id");

    if (!debtId) {
      return NextResponse.json(
        { error: "ID de deuda no proporcionado" },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Verificar que la deuda pertenece al usuario
    const existingDebt = await prisma.debt.findFirst({
      where: {
        id: debtId,
        userId: userId,
      },
    });

    if (!existingDebt) {
      return NextResponse.json(
        { error: "Deuda no encontrada" },
        { status: 404 }
      );
    }

    // Procesar linkedTransactions para almacenar como JSON string
    let linkedTransactionsString = undefined;
    if (data.linkedTransactions !== undefined) {
      linkedTransactionsString = data.linkedTransactions
        ? JSON.stringify(data.linkedTransactions)
        : null;
    }

    // Actualizar la deuda
    const updatedDebt = await prisma.debt.update({
      where: {
        id: debtId,
      },
      data: {
        description: data.description,
        totalAmount: data.totalAmount
          ? parseFloat(data.totalAmount)
          : undefined,
        remainingAmount: data.remainingAmount
          ? parseFloat(data.remainingAmount)
          : undefined,
        monthlyPayment: data.monthlyPayment
          ? parseFloat(data.monthlyPayment)
          : undefined,
        nextPaymentDate: data.nextPaymentDate
          ? new Date(data.nextPaymentDate)
          : undefined,
        frequency: data.frequency,
        creditor: data.creditor !== undefined ? data.creditor : undefined,
        interestRate:
          data.interestRate !== undefined
            ? data.interestRate
              ? parseFloat(data.interestRate)
              : null
            : undefined,
        interestFrequency: data.interestFrequency,
        linkedTransactions: linkedTransactionsString,
      },
    });

    // Devolver la deuda con linkedTransactions como array
    const processedDebt = {
      ...updatedDebt,
      linkedTransactions: updatedDebt.linkedTransactions
        ? JSON.parse(updatedDebt.linkedTransactions)
        : [],
    };

    return NextResponse.json(processedDebt);
  } catch (error) {
    console.error("Error al actualizar deuda:", error);
    return NextResponse.json(
      { error: "Error al actualizar la deuda" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una deuda
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const debtId = searchParams.get("id");

    if (!debtId) {
      return NextResponse.json(
        { error: "ID de deuda no proporcionado" },
        { status: 400 }
      );
    }

    // Verificar que la deuda pertenece al usuario
    const existingDebt = await prisma.debt.findFirst({
      where: {
        id: debtId,
        userId: userId,
      },
    });

    if (!existingDebt) {
      return NextResponse.json(
        { error: "Deuda no encontrada" },
        { status: 404 }
      );
    }

    // Eliminar la deuda
    await prisma.debt.delete({
      where: {
        id: debtId,
      },
    });

    return NextResponse.json(
      { message: "Deuda eliminada correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar deuda:", error);
    return NextResponse.json(
      { error: "Error al eliminar la deuda" },
      { status: 500 }
    );
  }
}
