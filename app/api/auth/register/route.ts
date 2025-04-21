import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Validar datos de entrada
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Verificar si el email ya está registrado
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Este email ya está registrado" },
        { status: 400 }
      );
    }

    // Encriptar la contraseña
    const hashedPassword = await hash(password, 10);

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Crear categorías predeterminadas para el usuario
    const defaultCategories = [
      { name: "Vivienda", icon: "Home", color: "#10b981", type: "expense" },
      {
        name: "Alimentación",
        icon: "ShoppingCart",
        color: "#3b82f6",
        type: "expense",
      },
      { name: "Transporte", icon: "Car", color: "#f59e0b", type: "expense" },
      { name: "Servicios", icon: "Zap", color: "#f43f5e", type: "expense" },
      { name: "Ocio", icon: "Film", color: "#8b5cf6", type: "expense" },
      { name: "Trabajo", icon: "Briefcase", color: "#10b981", type: "income" },
      {
        name: "Inversiones",
        icon: "TrendingUp",
        color: "#3b82f6",
        type: "income",
      },
      { name: "Ventas", icon: "ShoppingBag", color: "#f59e0b", type: "income" },
    ];

    // Crear las categorías en batch
    await Promise.all(
      defaultCategories.map(async (category) => {
        try {
          await prisma.category.create({
            data: {
              name: category.name,
              icon: category.icon,
              color: category.color,
              type: category.type,
              userId: user.id,
            },
          });
        } catch (error) {
          console.error(`Error creando categoría ${category.name}:`, error);
        }
      })
    );

    // Crear configuración predeterminada
    try {
      await prisma.settings.create({
        data: {
          userId: user.id,
          currency: "USD",
          dateFormat: "dd/MM/yyyy",
          language: "es",
          startWeekOnMonday: true,
          reminderDays: 3,
          budgetThreshold: 80,
        },
      });
    } catch (error) {
      console.error("Error creando configuración predeterminada:", error);
    }

    // Excluir la contraseña de la respuesta
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: "Usuario registrado con éxito", user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error durante el registro:", error);
    return NextResponse.json(
      { message: "Error al registrar usuario" },
      { status: 500 }
    );
  }
}
