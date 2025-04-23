import { PrismaClient } from "@prisma/client";

// Extender los tipos de PrismaClient para incluir los modelos que no están siendo reconocidos por TypeScript
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient;
}

// PrismaClient es adjuntado al objeto global en desarrollo para prevenir múltiples instancias
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Obtener una instancia de PrismaClient
export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Exportamos el cliente con una anotación de tipo que le indica a TypeScript que tiene los modelos correctos
export default prisma;
