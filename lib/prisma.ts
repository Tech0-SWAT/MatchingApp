import { PrismaClient } from "@prisma/client";
import path from "path";
import { fileURLToPath } from "url";

// Compute absolute path to the SQLite file reliably, even after Next.js build.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, "../prisma/dev.db");
const dbUrl = `file:${dbPath}`;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: { db: { url: dbUrl } }
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
