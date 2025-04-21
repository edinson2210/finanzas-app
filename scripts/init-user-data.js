#!/usr/bin/env node

/**
 * Script para inicializar categorías y configuración para usuarios existentes
 *
 * Uso:
 * node scripts/init-user-data.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Inicializando datos para usuarios existentes...");

  // Obtener todos los usuarios
  const users = await prisma.user.findMany();
  console.log(`📊 Encontrados ${users.length} usuarios`);

  for (const user of users) {
    console.log(`\n🧑 Procesando usuario: ${user.name || user.email}`);

    // Categorías predeterminadas
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

    // Verificar categorías existentes
    const existingCategories = await prisma.category.findMany({
      where: {
        userId: user.id,
      },
    });

    console.log(`🗂️ Categorías existentes: ${existingCategories.length}`);

    // Crear categorías que no existen
    if (existingCategories.length === 0) {
      console.log("➕ Creando categorías predeterminadas...");

      for (const category of defaultCategories) {
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
          console.log(`✅ Creada categoría: ${category.name}`);
        } catch (error) {
          console.error(
            `❌ Error creando categoría ${category.name}:`,
            error.message
          );
        }
      }
    } else {
      console.log("✅ El usuario ya tiene categorías");
    }

    // Verificar configuración existente
    const existingSettings = await prisma.settings.findUnique({
      where: {
        userId: user.id,
      },
    });

    // Crear configuración si no existe
    if (!existingSettings) {
      console.log("⚙️ Creando configuración predeterminada...");

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
        console.log("✅ Configuración creada");
      } catch (error) {
        console.error("❌ Error creando configuración:", error.message);
      }
    } else {
      console.log("✅ El usuario ya tiene configuración");
    }
  }

  console.log("\n🎉 Proceso completado!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
