/* src/lib/prisma.ts */

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../../generated/prisma";
import type { DriverAdapter } from "../../generated/prisma/runtime/library";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error("DATABASE_URL is not set in environment variables");
}

const pool = new Pool({ connectionString });

const adapter = new PrismaPg(pool) as unknown as DriverAdapter;

const globalForPrisma = global as unknown as {
	prisma: PrismaClient | undefined;
};

const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({
		adapter,
	});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
