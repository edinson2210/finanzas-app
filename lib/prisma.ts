import { PrismaClient } from "@prisma/client";

// PrismaClient es adjuntado al objeto global en desarrollo para prevenir múltiples instancias
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
