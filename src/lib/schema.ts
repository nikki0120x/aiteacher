import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	pgTable,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text("id").primaryKey(),

	email: text("email").notNull().unique(),
	emailVerified: boolean("emailVerified").notNull(),

	name: text("name").unique(),

	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),

	password: text("password"),

	termsAccepted: boolean("termsAccepted").notNull().default(false),
	termsAcceptedAt: timestamp("termsAcceptedAt"),

	accessedAt: timestamp("accessedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),

	expiresAt: timestamp("expiresAt").notNull(),
	token: text("token").notNull().unique(),

	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),

	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),

	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),

	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),

	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),

	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	idToken: text("idToken"),

	accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
	refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),

	scope: text("scope"),
	password: text("password"),

	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),

	identifier: text("identifier").notNull(),
	value: text("value").notNull(),

	expiresAt: timestamp("expiresAt").notNull(),
	createdAt: timestamp("createdAt").defaultNow(),
	updatedAt: timestamp("updatedAt").defaultNow(),
});

export const device = pgTable("device", {
	id: text("id").primaryKey(),

	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),

	os: text("os"),
	model: text("model"),
	browser: text("browser"),

	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const appConfig = pgTable("app_config", {
	deviceId: text("deviceId")
		.primaryKey()
		.references(() => device.id, { onDelete: "cascade" }),

	notifications: text("notifications").notNull().default("notification.all"),
	theme: text("theme").notNull().default("theme.system"),
	language: text("language").notNull().default("language.en-US"),
	location: text("location").notNull().default("location.US"),
});

export const profile = pgTable(
	"profile",
	{
		id: text("id").primaryKey(),

		serviceId: text("serviceId").notNull(),

		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		role: text("role").notNull().default("role.user"),
		nickname: text("nickname").notNull().default(""),
	},
	(table) => [
		unique("profile_user_service_unique").on(table.userId, table.serviceId),
	],
);

export const subscriptionStatus = pgTable("subscription_status", {
	profileId: text("profileId")
		.primaryKey()
		.references(() => profile.id, { onDelete: "cascade" }),

	planning: text("planning").notNull().default("free"),
	status: text("status").notNull().default("active"),
	platform: text("platform"),
	autoRenewing: boolean("autoRenewing").notNull().default(false),

	expiresAt: timestamp("expiresAt"),
	confirmedAt: timestamp("confirmedAt").notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
	accounts: many(account),
	sessions: many(session),
	profiles: many(profile),
	devices: many(device),
}));

export const rateLimit = pgTable("rate_limit", {
	id: text("id").primaryKey(),
	ip: text("ip").notNull(),
	action: text("action").notNull(),
	attempts: integer("attempts").notNull().default(0),
	lockoutUntil: timestamp("lockoutUntil"),
	createdAt: timestamp("createdAt").defaultNow(),
	updatedAt: timestamp("updatedAt").defaultNow(),
});
