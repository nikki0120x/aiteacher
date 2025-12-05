/* src\lib\auth.ts */
import { betterAuth } from "better-auth";
import { prisma } from "@/lib/prisma";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
	secret: process.env.AUTH_SECRET,

	adapter: {
		type: "prisma",
		client: prisma,
	},

	emailAndPassword: {
		enabled: true,
	},

	plugins: [nextCookies()],
});
