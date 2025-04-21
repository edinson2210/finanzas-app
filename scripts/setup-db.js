#!/usr/bin/env node

/**
 * Script para configurar la base de datos de la aplicación de finanzas
 *
 * Prerequisitos:
 * 1. Tener instalado PostgreSQL
 * 2. Tener las variables de entorno configuradas en .env
 *
 * Uso:
 * npm run setup-db
 */

const { execSync } = require("child_process");
const { existsSync, mkdirSync } = require("fs");
const path = require("path");

// Verifica si el directorio prisma existe
const prismaDir = path.join(__dirname, "..", "prisma");
if (!existsSync(prismaDir)) {
  mkdirSync(prismaDir);
  console.log("Directorio prisma creado");
}

try {
  // Paso 1: Inicializar Prisma y generar el cliente
  console.log("🔄 Inicializando Prisma y generando el cliente...");
  execSync("npx prisma generate", { stdio: "inherit" });

  // Paso 2: Realizar la migración inicial
  console.log("🔄 Creando tablas en la base de datos...");
  execSync("npx prisma migrate dev --name init", { stdio: "inherit" });

  console.log("✅ Base de datos configurada correctamente!");
  console.log("\n🚀 Puedes iniciar el servidor con: npm run dev");
} catch (error) {
  console.error("❌ Error al configurar la base de datos:", error.message);
  console.error("\nVerifica que:");
  console.error("1. PostgreSQL está instalado y ejecutándose");
  console.error("2. Las credenciales en el archivo .env son correctas");
  console.error(
    '3. La base de datos "finanzas_app" existe o el usuario tiene permisos para crearla'
  );
  process.exit(1);
}
