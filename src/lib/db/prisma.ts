import { PrismaClient } from "@/generated/prisma/client";
import { AccentColor } from "@/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Bumped when schema/client delegates change — invalidates dev singleton after `prisma generate`.
 * (Stale singletons lack new models/enums e.g. BillingTransaction, AccentColor WHITE/BLACK.)
 */
const PRISMA_CLIENT_GENERATION = `mv-prisma-${AccentColor.WHITE}-${AccentColor.BLACK}-billing-v1`;

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

type PrismaClientSingleton = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
  prismaGeneration?: string;
};

if (
  process.env.NODE_ENV !== "production" &&
  globalForPrisma.prismaGeneration !== PRISMA_CLIENT_GENERATION
) {
  void globalForPrisma.prisma?.$disconnect().catch(() => {});
  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaGeneration = PRISMA_CLIENT_GENERATION;
}

// Reuse a single PrismaClient across Next.js dev-server hot reloads instead
// of opening a fresh connection pool on every module reload.
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
