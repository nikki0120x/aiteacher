import { z } from "zod";
import { asZodEnum, gen, withDefault } from "./util";

//  ================================================================
//      MAP
//  ================================================================

//  ロール
export const ROLE_MAP = {
	user: "role.user",
	model: "role.model",
} as const;

//  モデル
export const MODEL_MAP = {
	fast: "model.fast",
	standard: "model.standard",
	think: "model.think",
} as const;

//  ユーザー状態
export const USER_STATUS_MAP = {
	pending: "status.user.pending",
	sending: "status.user.sending",
	sent: "status.user.sent",
	completed: "status.user.completed",
	canceled: "status.user.canceled",
	aborted: "status.user.aborted",
	failed: "status.user.failed",
} as const;

//  モデル状態
export const MODEL_STATUS_MAP = {
	pending: "status.model.pending",
	thinking: "status.model.thinking",
	streaming: "status.model.streaming",
	sent: "status.model.sent",
	completed: "status.model.completed",
	canceled: "status.model.canceled",
	aborted: "status.model.aborted",
	failed: "status.model.failed",
} as const;

//  評価
export const EVALUATION_MAP = {
	positive: "evaluation.positive",
	negative: "evaluation.negative",
} as const;

//  ================================================================
//      送信構成
//  ================================================================

//  ================================ 送信構成 ================================

//  内容
export const ContentSchema = withDefault(
	z
		.object({
			role: z.enum(asZodEnum(ROLE_MAP)),
			parts: z.array(z.lazy(() => PartSchema)).readonly(),
		})
		.readonly(),
	() => ({
		role: "user" as const,
		parts: [],
	}),
);
export type Content = z.infer<typeof ContentSchema>;

//  要素
export const PartSchema = withDefault(
	z
		.object({
			text: z.string().optional(),
			file: z
				.object({
					src: z.string(),
					mimeType: z.string(),
					fileName: z.string(),
				})
				.optional()
				.readonly(),
		})
		.readonly(),
	() => ({}),
);
export type Part = z.infer<typeof PartSchema>;

//  送信情報
export const PostPayloadSchema = withDefault(
	z
		.object({
			model: z.enum(asZodEnum(MODEL_MAP)).readonly(),
			prompt: ContentSchema.readonly(),
			mediaUrls: z.array(z.string()).optional().readonly(),
			history: z.array(ContentSchema).optional().readonly(),
		})
		.readonly(),
	() => ({
		model: "fast" as const,
		prompt: ContentSchema.createDefault(),
		mediaUrls: [],
	}),
);
export type PostPayload = z.infer<typeof PostPayloadSchema>;

//  ================================================================
//      チャット構成
//  ================================================================

//  ================================ 流動構成 ================================

//  流動リスト
export const ChatFlowListSchema = withDefault(
	z.array(z.lazy(() => ChatFlowSchema).readonly()).readonly(),
	() => [],
);
export type ChatFlowList = z.infer<typeof ChatFlowListSchema>;

//  流動
export const ChatFlowSchema = withDefault(
	z
		.object({
			turns: z.lazy(() => TurnListSchema).readonly(),
			fileId: z.uuid(),
			activeTurnId: z.uuid().nullable(),
			icon: z.union([z.string()]),
			title: z.string(),
			description: z.string(),
			isPinned: z.boolean(),
			token: z.number(),
			size: z.number(),
			count: z.number(),
			createdAt: z.number(),
			modifiedAt: z.number(),
			accessedAt: z.number(),
		})
		.readonly(),
	() => ({
		turns: TurnListSchema.createDefault(),
		fileId: gen.id(),
		activeTurnId: null,
		icon: "",
		title: "",
		description: "",
		isPinned: false,
		token: 0,
		size: 0,
		count: 0,
		createdAt: gen.now(),
		modifiedAt: gen.now(),
		accessedAt: gen.now(),
	}),
);
export type ChatFlow = z.infer<typeof ChatFlowSchema>;

//  ================================ 会話構成 ================================

//  会話リスト
export const TurnListSchema = withDefault(
	z.array(z.lazy(() => TurnSchema).readonly()).readonly(),
	() => [],
);
export type TurnList = z.infer<typeof TurnListSchema>;

//  会話
export const TurnSchema = withDefault(
	z
		.object({
			turnId: z.uuid(),
			pages: z.lazy(() => PageListSchema).readonly(),
			activePageIndex: z.number(),
			title: z.string(),
			description: z.string(),
			isPinned: z.boolean(),
			feedback: z.enum(asZodEnum(EVALUATION_MAP)).nullable(),
			count: z.number(),
			size: z.number(),
			token: z.number(),
			createdAt: z.number(),
			modifiedAt: z.number(),
			accessedAt: z.number(),
		})
		.readonly(),
	() => ({
		pages: PageListSchema.createDefault(),
		turnId: gen.id(),
		activePageIndex: 0,
		title: "",
		description: "",
		isPinned: false,
		feedback: null,
		count: 0,
		size: 0,
		token: 0,
		createdAt: gen.now(),
		modifiedAt: gen.now(),
		accessedAt: gen.now(),
	}),
);
export type Turn = z.infer<typeof TurnSchema>;

//  ================================ 頁構成 ================================

//	頁リスト
export const PageListSchema = withDefault(
	z.array(z.lazy(() => PageSchema).readonly()).readonly(),
	() => [],
);
export type PageList = z.infer<typeof PageListSchema>;

//	頁
export const PageSchema = withDefault(
	z
		.object({
			pageIndex: z.number(),
			messages: z.lazy(() => MessageListSchema).readonly(),
			count: z.number(),
			size: z.number(),
			token: z.number(),
			timestampAt: z.number(),
		})
		.readonly(),
	() => ({
		pageIndex: 0,
		messages: MessageListSchema.createDefault(),
		count: 0,
		size: 0,
		token: 0,
		timestampAt: gen.now(),
	}),
);
export type Page = z.infer<typeof PageSchema>;

//  ================================ メッセージ構成 ================================

//  メッセージリスト
export const MessageListSchema = withDefault(
	z
		.object({
			user: z.lazy(() => UserMessageSchema).readonly(),
			model: z.array(z.lazy(() => ModelMessageSchema).readonly()).readonly(),
		})
		.readonly(),
	() => ({
		user: UserMessageSchema.createDefault(),
		model: [ModelMessageSchema.createDefault()],
	}),
);
export type MessageList = z.infer<typeof MessageListSchema>;

//  ユーザーメッセージ
export const UserMessageSchema = withDefault(
	z
		.object({
			userMessageId: z.uuid(),
			blocks: z.lazy(() => BlockListSchema).readonly(),
			media: z.lazy(() => MediumListSchema).readonly(),
			role: z.enum(asZodEnum(ROLE_MAP)),
			status: z.enum(asZodEnum(USER_STATUS_MAP)),
			size: z.number(),
			token: z.number(),
			timestampAt: z.number(),
		})
		.readonly(),
	() => ({
		userMessageId: gen.id(),
		blocks: BlockListSchema.createDefault(),
		media: MediumListSchema.createDefault(),
		role: "user" as const,
		status: "pending" as const,
		size: 0,
		token: 0,
		timestampAt: gen.now(),
	}),
);
export type UserMessage = z.infer<typeof UserMessageSchema>;

//  モデルメッセージ
export const ModelMessageSchema = withDefault(
	z
		.object({
			modelMessageId: z.uuid(),
			blocks: z.lazy(() => BlockListSchema).readonly(),
			model: z.enum(asZodEnum(MODEL_MAP)),
			role: z.enum(asZodEnum(ROLE_MAP)),
			status: z.enum(asZodEnum(MODEL_STATUS_MAP)),
			size: z.number(),
			token: z.number(),
			timestampAt: z.number(),
		})
		.readonly(),
	() => ({
		modelMessageId: gen.id(),
		blocks: BlockListSchema.createDefault(),
		model: "fast" as const,
		role: "model" as const,
		status: "pending" as const,
		size: 0,
		token: 0,
		timestampAt: gen.now(),
	}),
);
export type ModelMessage = z.infer<typeof ModelMessageSchema>;

//  ================================ 入力構成 ================================

//	文字
export const InputTextSchema = withDefault(
	z
		.object({
			inputText: z.string().trim(),
		})
		.readonly(),
	() => ({
		inputText: "",
	}),
);
export type InputText = z.infer<typeof InputTextSchema>;

//  ================================ 媒体構成 ================================

//  媒体リスト
export const MediumListSchema = withDefault(
	z.array(z.lazy(() => MediumSchema).readonly()).readonly(),
	() => [],
);
export type MediumList = z.infer<typeof MediumListSchema>;

//  媒体
export const MediumSchema = withDefault(
	z
		.object({
			mediumId: z.uuid(),
			src: z.string(),
			file: z.instanceof(File).optional().readonly(),
			fileName: z.string(),
			mimeType: z.string(),
			size: z.number(),
			token: z.number(),
			timestampAt: z.number(),
		})
		.readonly(),
	() => ({
		mediumId: gen.id(),
		src: "",
		fileName: "",
		mimeType: "",
		size: 0,
		token: 0,
		timestampAt: gen.now(),
	}),
);
export type Medium = z.infer<typeof MediumSchema>;

//  ================================ 区画構成 ================================

//  区画リスト
export const BlockListSchema = withDefault(
	z.array(z.lazy(() => BlockSchema).readonly()).readonly(),
	() => [],
);
export type BlockList = z.infer<typeof BlockListSchema>;

//  区画
export const BlockSchema = withDefault(
	z
		.union([
			z
				.object({
					type: z.literal("none"),
					content: z.string(),
				})
				.readonly(),
			z
				.object({
					type: z.literal("text"),
					content: z.string(),
				})
				.readonly(),
			z
				.object({
					type: z.literal("medium"),
					content: z.string(),
				})
				.readonly(),
			z
				.object({
					type: z.literal("modernJapanese"),
					content: z.string(),
				})
				.readonly(),
			z
				.object({
					type: z.literal("classicalJapanese"),
					content: z.string(),
				})
				.readonly(),
			z
				.object({
					type: z.literal("classicalChinese"),
					content: z.string(),
				})
				.readonly(),
			z
				.object({
					type: z.literal("map"),
					content: z.string(),
				})
				.readonly(),
			z
				.object({
					type: z.literal("formula"),
					content: z.string(),
				})
				.readonly(),
			z
				.object({
					type: z.literal("graph"),
					content: z.string(),
				})
				.readonly(),
			z
				.object({
					type: z.literal("error"),
					content: z.string(),
				})
				.readonly(),
		])
		.readonly(),
	() => ({
		type: "none" as const,
		content: "",
	}),
);
export type Block = z.infer<typeof BlockSchema>;
