import { PrismaClient } from "@prisma/client";

// В dev Next перезагружает модули — без этого каждый раз открывался бы новый пул соединений.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
