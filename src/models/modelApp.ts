import { z } from "zod";
import { asZodEnum, gen, withDefault } from "./util";

//  ================================================================
//      MAP
//  ================================================================

//	ロール
export const ROLE_MAP = {
	user: "role.user",
	administrator: "role.administrator",
	demo: "role.demo",
} as const;

//  プラン
export const PLAN_MAP = {
	free: "free",
	plus: "plus",
	pro: "pro",
	premium: "premium",
} as const;
11;

//  プラットフォーム
export const PLATFORM_MAP = {
	google: "google",
	apple: "apple",
} as const;

//  サブスクリプション状態
export const SUBSCRIPTION_STATUS_MAP = {
	active: "active",
	expired: "expired",
	canceled: "canceled",
	terminated: "terminated",
} as const;

//  サブスクリプション履歴種類
export const SUBSCRIPTION_TYPE_MAP = {
	new: "new",
	renew: "renew",
	change: "change",
} as const;

//  通貨
export const CURRENCY_MAP = {
	JPY: "currency.JPY",
	USD: "currency.USD",
} as const;

//  決済状態
export const TRANSACTION_STATUS_MAP = {
	completed: "completed",
	refunded: "refunded",
	canceled: "canceled",
	terminated: "terminated",
	failed: "failed",
} as const;

//	メニュー
export const APP_MENU_MAP = {
	notifications: "menu.notifications",
	theme: "menu.theme",
	language: "menu.language",
	location: "menu.location",
	settings: "menu.settings",
} as const;

//	通知
export const APP_NOTIFICATION_MAP = {
	all: "notification.all",
	unread: "notification.unread",
	read: "notification.read",
	type: "notification.type",
} as const;

//  テーマ
export const APP_THEME_MAP = {
	system: "theme.system",
	light: "theme.light",
	dark: "theme.dark",
} as const;

//  言語
export const APP_LANGUAGE_MAP = {
	"ja-JP": "language.ja-JP",
	"en-US": "language.en-US",
} as const;

//	地域
export const APP_LOCATION_MAP = {
	JP: "location.JP",
	US: "location.US",
} as const;

//  ================================================================
//      アカウント構成
//  ================================================================

// アカウント
export const AccountSchema = withDefault(
	z
		.object({
			aid: z.uuid(),
			email: z.email(),
			emailVerified: z.boolean(),
			emailVerifiedAt: z.number(),
			termsAccepted: z.boolean(),
			termsAcceptedAt: z.number(),
			username: z.string(),
			avatar: z.string(),
			createdAt: z.number(),
			modifiedAt: z.number(),
			accessedAt: z.number(),
		})
		.readonly(),
	() => ({
		aid: gen.id(),
		email: "",
		emailVerified: false,
		emailVerifiedAt: gen.now(),
		provider: null,
		username: "",
		avatar: "",
		termsAccepted: false,
		termsAcceptedAt: gen.now(),
		createdAt: gen.now(),
		modifiedAt: gen.now(),
		accessedAt: gen.now(),
	}),
);
export type Account = z.infer<typeof AccountSchema>;

//  ================================================================
//      プロファイル構成
//  ================================================================

// プロファイル
export const ProfileSchema = withDefault(
	z
		.object({
			uid: z.uuid(),
			role: z.enum(asZodEnum(ROLE_MAP)),
			nickname: z.string(),
			subscriptionStatus: z.lazy(() => SubscriptionStatusSchema).readonly(),
			subscriptionHistory: z.lazy(() => SubscriptionHistorySchema).readonly(),
		})
		.readonly(),
	() => ({
		uid: gen.id(),
		role: "user" as const,
		nickname: "",
		subscriptionStatus: SubscriptionStatusSchema.createDefault(),
		subscriptionHistory: [],
	}),
);
export type Profile = z.infer<typeof ProfileSchema>;

// サブスクリプション状態
export const SubscriptionStatusSchema = withDefault(
	z
		.object({
			transactionId: z.string().optional(),
			orderId: z.string().optional(),
			isTrial: z.boolean().optional(),
			isGracePeriod: z.boolean().optional(),
			planning: z.enum(asZodEnum(PLAN_MAP)),
			renewalPlanning: z.enum(asZodEnum(PLAN_MAP)).optional(),
			platform: z.enum(asZodEnum(PLATFORM_MAP)).optional(),
			autoRenewing: z.boolean(),
			status: z.enum(asZodEnum(SUBSCRIPTION_STATUS_MAP)),
			expiresAt: z.number().optional(),
			purchasedAt: z.number().optional(),
			renewedAt: z.number().optional(),
			canceledAt: z.number().optional(),
			terminatedAt: z.number().optional(),
			confirmedAt: z.number(),
		})
		.readonly(),
	() => ({
		planning: "free" as const,
		autoRenewing: false,
		status: "active" as const,
		confirmedAt: gen.now(),
	}),
);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

// サブスクリプション履歴
export const SubscriptionHistorySchema = withDefault(
	z
		.array(
			z
				.object({
					transactionId: z.string(),
					orderId: z.string(),
					type: z.enum(asZodEnum(SUBSCRIPTION_TYPE_MAP)),
					plan: z.enum(["plus", "pro", "premium"]),
					platform: z.enum(asZodEnum(PLATFORM_MAP)),
					autoRenewing: z.boolean(),
					amount: z.number(),
					currency: z.enum(asZodEnum(CURRENCY_MAP)),
					status: z.enum(asZodEnum(TRANSACTION_STATUS_MAP)),
					startedAt: z.number(),
					endedAt: z.number().optional(),
					servicePeriodStart: z.number().optional(),
					servicePeriodEnd: z.number().optional(),
					completedAt: z.number().optional(),
					refundedAt: z.number().optional(),
					canceledAt: z.number().optional(),
					terminatedAt: z.number().optional(),
					failedAt: z.number().optional(),
					receiptData: z.string().optional(),
					description: z.string().optional(),
				})
				.readonly(),
		)
		.readonly(),
	() => [],
);
export type SubscriptionHistory = z.infer<typeof SubscriptionHistorySchema>;

//  ================================================================
//      端末構成
//  ================================================================

// 端末
export const DeviceSchema = withDefault(
	z
		.object({
			did: z.uuid(),
			os: z.string(),
			model: z.string(),
			browser: z.string(),
			createdAt: z.number(),
			updatedAt: z.number(),
		})
		.readonly(),
	() => ({
		did: gen.id(),
		os: "",
		model: "",
		browser: "",
		createdAt: gen.now(),
		updatedAt: gen.now(),
	}),
);
export type Device = z.infer<typeof DeviceSchema>;

//  ================================================================
//      設定構成
//  ================================================================

//  ================================ メニュー構成 ================================

//  メニュー
export const AppMenuSchema = withDefault(
	z.enum(asZodEnum(APP_MENU_MAP)).nullable(),
	() => null,
);
export type AppMenu = z.infer<typeof AppMenuSchema>;

//  ================================ 通知構成 ================================

// 通知
export const AppNotificationSchema = withDefault(
	z.enum(asZodEnum(APP_NOTIFICATION_MAP)),
	() => "all" as const,
);
export type AppNotification = z.infer<typeof AppNotificationSchema>;

//  ================================ テーマ構成 ================================

//  テーマ
export const AppThemeSchema = withDefault(
	z.enum(asZodEnum(APP_THEME_MAP)),
	() => "system" as const,
);
export type AppTheme = z.infer<typeof AppThemeSchema>;

//  ================================ 言語構成 ================================

//  言語
export const AppLanguageSchema = withDefault(
	z.enum(asZodEnum(APP_LANGUAGE_MAP)),
	() => "en-US" as const,
);
export type AppLanguage = z.infer<typeof AppLanguageSchema>;

//  ================================ 地域構成 ================================

//	地域
export const AppLocationSchema = withDefault(
	z.enum(asZodEnum(APP_LOCATION_MAP)),
	() => "US" as const,
);
export type AppLocation = z.infer<typeof AppLocationSchema>;
