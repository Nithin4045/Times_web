
import { PrismaClient } from '@/generated/prisma';

const globalForPrismaWordDb = globalThis as unknown as {
  prismaWordDb: PrismaClient | undefined;
};

export const prismaWordDb =
  globalForPrismaWordDb.prismaWordDb ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.WORD_TO_DB_DATABASE_URL,
      },
    },
    log: [], // disables all Prisma logs
  });

if (process.env.NODE_ENV !== 'production') globalForPrismaWordDb.prismaWordDb = prismaWordDb;
