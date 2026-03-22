import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification,
		},
	}),

	pages: {
		signIn: "/sign?mode=signin",
		newUser: "/sign?mode=signup",
	},

	emailAndPassword: {
		enabled: true,
	},

	hooks: {
		before: async (ctx) => {
			const path = (ctx as { path?: string }).path;

			if (path === "/sign-in/email") {
				const body = ctx.body as
					| { email?: string; password?: string }
					| undefined;

				if (body?.email) {
					const foundUser = await db.query.user.findFirst({
						where: or(
							eq(schema.user.email, body.email),
							eq(schema.user.name, body.email),
						),
					});

					if (foundUser) {
						body.email = foundUser.email;
					}
				}
			}
			return ctx;
		},
	},

	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID ?? "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
			mapProfileToUser: async (profile) => {
				return {
					email: profile.email,
					emailVerified: profile.email_verified,
					name: null,
					image: profile.picture,
				};
			},
		},
	},
});
