import { PrismaClient } from '@prisma/client';

/**
 * Create a Prisma client instance
 * @returns The Prisma client
 */
function createPrismaClient() {
  return new PrismaClient();
}

// Add prisma to the global type
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create the prisma client
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Save prisma client to global in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
} 