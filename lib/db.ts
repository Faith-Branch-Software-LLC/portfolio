import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

dotenv.config();

/**
 * Create a Prisma client instance with MariaDB adapter for v7
 * @returns The Prisma client configured with Direct TCP adapter
 */
function createPrismaClient() {
  const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);

  return new PrismaClient({
    adapter,
  });
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
