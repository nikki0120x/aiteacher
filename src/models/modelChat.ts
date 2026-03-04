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
	"gemini-3-pro-preview": "model.gemini-3-pro-preview",
	"gemini-3-flash-preview": "model.gemini-3-flash-preview",
	"gemini-2.5-pro": "model.gemini-2.5-pro",
	"gemini-2.5-flash": "model.gemini-2.5-flash",
	"gemini-2.5-flash-lite": "model.gemini-2.5-flash-lite",
	"gemini-2.0-flash": "model.gemini-2.0-flash",
	"gemini-2.0-flash-lite": "model.gemini-2.0-flash-lite",
} as const;

//  スライダー
export const SLIDER_MAP = {
	0: "slider.0",
	0.25: "slider.25",
	0.5: "slider.50",
	0.75: "slider.75",
	1: "slider.100",
} as const;

//  スイッチ
export const SWITCH_MAP = {
	summary: "switch.summary",
	guidance: "switch.guidance",
	explanation: "switch.explanation",
	answer: "switch.answer",
} as const;

//  並べ替え
export const SORT_MAP = {
	name: "sort.name",
	pinned: "sort.pinned",
	token: "sort.token",
	size: "sort.size",
	count: "sort.count",
	created: "sort.created",
	modified: "sort.modified",
	accessed: "sort.accessed",
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

//	区分
export const CATEGORY_MAP = {
	default: "category.default",
} as const;

//  教科
export const SUBJECT_MAP = {
	others: "other",
	japanese_language: "subject.japanese_language",
	geography_and_history: "subject.geography_and_history",
	civics: "subject.civics",
	mathematics: "subject.mathematics",
	science: "subject.science",
	foreign_languages: "subject.foreign_languages",
	informatics: "subject.informatics",
} as const;

//	その他
export const OTHER_MAP = {
	other: "course.others.other",
} as const;

//  国語
export const JAPANESE_LANGUAGE_MAP = {
	modern_japanese: "course.japanese_language.modern_japanese",
	classical_japanese: "course.japanese_language.classical_japanese",
	classical_Chinese: "course.japanese_language.classical_Chinese",
} as const;

//	地理歴史
export const GEOGRAPHY_AND_HISTORY_MAP = {
	geography: "course.geography_and_history.geography",
	advanced_geography: "course.geography_and_history.advanced_geography",
	modern_and_contemporary_history:
		"course.geography_and_history.modern_and_contemporary_history",
	advanced_japanese_history:
		"course.geography_and_history.advanced_japanese_history",
	advanced_world_history: "course.geography_and_history.advanced_world_history",
} as const;

//  公民
export const CIVICS_MAP = {
	public: "course.civics.public",
	ethics: "course.civics.ethics",
	politics_and_economy: "course.civics.politics_and_economy",
} as const;

//	数学
export const MATHEMATICS_MAP = {
	mathematics_1: "course.mathematics.mathematics_1",
	mathematics_A: "course.mathematics.mathematics_A",
	mathematics_2: "course.mathematics.mathematics_2",
	mathematics_B: "course.mathematics.mathematics_B",
	mathematics_3: "course.mathematics.mathematics_3",
	mathematics_C: "course.mathematics.mathematics_C",
} as const;

//  理科
export const SCIENCE_MAP = {
	basic_physics: "course.science.basic_physics",
	advanced_physics: "course.science.advanced_physics",
	basic_chemistry: "course.science.basic_chemistry",
	advanced_chemistry: "course.science.advanced_chemistry",
	basic_biology: "course.science.basic_biology",
	advanced_biology: "course.science.advanced_biology",
	basic_earth_science: "course.science.basic_earth_science",
	advanced_earth_science: "course.science.advanced_earth_science",
} as const;

//	外国語
export const FOREIGN_LANGUAGES_MAP = {
	english: "course.foreign_languages.english",
	german: "course.foreign_languages.german",
	french: "course.foreign_languages.french",
	chinese: "course.foreign_languages.chinese",
	korean: "course.foreign_languages.korean",
} as const;

//	情報
export const INFORMATICS_MAP = {
	informatics_1: "course.informatics.informatics_1",
	informatics_2: "course.informatics.informatics_2",
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
			prompt: ContentSchema.readonly(),
			file: z
				.array(
					z
						.object({
							file: z.instanceof(File).readonly(),
							mimeType: z.string(),
							fileName: z.string(),
						})
						.readonly(),
				)
				.optional()
				.readonly(),
			history: z.array(ContentSchema).optional().readonly(),
			model: z.lazy(() => ModelSchema).readonly(),
			sliderState: z.lazy(() => SliderStateSchema).readonly(),
			switchState: z.lazy(() => SwitchStateSchema).readonly(),
			questionState: z.lazy(() => QuestionStateSchema).readonly(),
		})
		.readonly(),
	() => ({
		prompt: ContentSchema.createDefault(),
		model: ModelSchema.createDefault(),
		sliderState: SliderStateSchema.createDefault(),
		switchState: SwitchStateSchema.createDefault(),
		questionState: QuestionStateSchema.createDefault(),
	}),
);
export type PostPayload = z.infer<typeof PostPayloadSchema>;

//  ================================================================
//      設定構成
//  ================================================================

//  ================================ 応答構成 ================================

//  モデル
export const ModelSchema = withDefault(
	z.enum(asZodEnum(MODEL_MAP)),
	() => "gemini-2.5-flash" as const,
);
export type Model = z.infer<typeof ModelSchema>;

//  ================================ 返答構成 ================================

//  スライダー状態
export const SliderStateSchema = withDefault(
	z
		.object({
			isEnabled: z.boolean(),
			politeness: z
				.enum(Object.keys(SLIDER_MAP) as [string, ...string[]])
				.transform((val) => Number(val)),
		})
		.readonly(),
	() => ({
		isEnabled: true,
		politeness: 0.5,
	}),
);
export type SliderState = z.infer<typeof SliderStateSchema>;

//  スイッチ状態
export const SwitchStateSchema = withDefault(
	z
		.object({
			isEnabled: z.boolean(),
		})
		.and(
			z.record(
				z.enum(Object.keys(SWITCH_MAP) as [string, ...string[]]),
				z.boolean(),
			),
		)
		.readonly(),
	() => ({
		isEnabled: true,
		summary: true,
		guidance: true,
		explanation: true,
		answer: true,
	}),
);
export type SwitchState = z.infer<typeof SwitchStateSchema>;

//  設問状態
export const QuestionStateSchema = withDefault(
	z
		.object({
			isEnabled: z.boolean(),
			range: z.union([z.literal("auto"), z.array(z.string()).readonly()]),
		})
		.readonly(),
	() => ({
		isEnabled: true,
		range: "auto" as const,
	}),
);
export type QuestionState = z.infer<typeof QuestionStateSchema>;

//  ================================================================
//      チャット構成
//  ================================================================

//  ================================ フォルダ構成 ================================

//  フォルダリスト
export const ChatFolderListSchema = withDefault(
	z
		.object({
			items: z.array(z.lazy(() => ChatFolderSchema)).readonly(),
			sort: z.enum(asZodEnum(SORT_MAP)).nullable(),
			isAscending: z.boolean(),
		})
		.readonly(),
	() => ({
		items: [],
		sort: null,
		isAscending: false,
	}),
);
export type ChatFolderList = z.infer<typeof ChatFolderListSchema>;

//  フォルダ
export const ChatFolderSchema = withDefault(
	z
		.object({
			files: z.lazy(() => ChatFileListSchema).readonly(),
			folderId: z.uuid(),
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
		files: ChatFileListSchema.createDefault(),
		folderId: gen.id(),
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
export type ChatFolder = z.infer<typeof ChatFolderSchema>;

//  ================================ ファイル構成 ================================

//  ファイルリスト
export const ChatFileListSchema = withDefault(
	z
		.object({
			items: z.array(z.lazy(() => ChatFileSchema)).readonly(),
			sort: z.enum(asZodEnum(SORT_MAP)).nullable(),
			isAscending: z.boolean(),
		})
		.readonly(),
	() => ({
		items: [],
		sort: null,
		isAscending: false,
	}),
);
export type ChatFileList = z.infer<typeof ChatFileListSchema>;

//  ファイル
export const ChatFileSchema = withDefault(
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
export type ChatFile = z.infer<typeof ChatFileSchema>;

//  ================================ ターン構成 ================================

//  ターンリスト
export const TurnListSchema = withDefault(
	z.array(z.lazy(() => TurnSchema).readonly()).readonly(),
	() => [],
);
export type TurnList = z.infer<typeof TurnListSchema>;

//  ターン
export const TurnSchema = withDefault(
	z
		.object({
			turnId: z.uuid(),
			pages: z.lazy(() => PageListSchema).readonly(),
			activePageIndex: z.number(),
			model: ModelSchema.readonly(),
			title: z.string(),
			description: z.string(),
			isPinned: z.boolean(),
			curriculum: z.lazy(() => CurriculumSchema).readonly(),
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
		model: ModelSchema.createDefault(),
		title: "",
		description: "",
		isPinned: false,
		curriculum: CurriculumSchema.createDefault(),
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

//  ================================ ページ構成 ================================

//	ページリスト
export const PageListSchema = withDefault(
	z.array(z.lazy(() => PageSchema).readonly()).readonly(),
	() => [],
);
export type PageList = z.infer<typeof PageListSchema>;

//	ページ
export const PageSchema = withDefault(
	z
		.object({
			pageIndex: z.number(),
			activeQuestionIndex: z.number(),
			questions: z.lazy(() => QuestionListSchema).readonly(),
			count: z.number(),
			size: z.number(),
			token: z.number(),
			timestampAt: z.number(),
		})
		.readonly(),
	() => ({
		pageIndex: 0,
		activeQuestionIndex: 0,
		questions: QuestionListSchema.createDefault(),
		count: 0,
		size: 0,
		token: 0,
		timestampAt: gen.now(),
	}),
);
export type Page = z.infer<typeof PageSchema>;

//  ================================ 設問構成 ================================

//	設問リスト
export const QuestionListSchema = withDefault(
	z.array(z.lazy(() => QuestionSchema).readonly()).readonly(),
	() => [],
);
export type QuestionList = z.infer<typeof QuestionListSchema>;

//	設問
export const QuestionSchema = withDefault(
	z
		.object({
			questionIndex: z.number(),
			questionDisplay: z.string(),
			messages: z.lazy(() => MessageListSchema).readonly(),
			count: z.number(),
			size: z.number(),
			token: z.number(),
			timestampAt: z.number(),
		})
		.readonly(),
	() => ({
		questionIndex: 0,
		questionDisplay: "",
		messages: MessageListSchema.createDefault(),
		count: 0,
		size: 0,
		token: 0,
		timestampAt: gen.now(),
	}),
);
export type Question = z.infer<typeof QuestionSchema>;

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
			sliderState: SliderStateSchema.readonly(),
			switchState: SwitchStateSchema.readonly(),
			questionState: QuestionStateSchema.readonly(),
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
		sliderState: SliderStateSchema.createDefault(),
		switchState: SwitchStateSchema.createDefault(),
		questionState: QuestionStateSchema.createDefault(),
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
					type: z.literal("glossary"),
					content: z
						.array(
							z
								.object({
									term: z.string(),
									description: z.string(),
									importance: z.number().min(1).max(5),
								})
								.readonly(),
						)
						.readonly(),
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

//  ================================================================
//      教案構成
//  ================================================================

//	教案
export const CurriculumSchema = withDefault(
	z
		.object({
			categoryId: z.string(),
			categoryName: z.string(),
			subjectId: z.string().nullable(),
			subjectName: z.string().nullable(),
			courseId: z.string().nullable(),
			courseName: z.string().nullable(),
		})
		.readonly(),
	() => ({
		categoryId: "default",
		categoryName: "category.default",
		subjectId: null,
		subjectName: null,
		courseId: null,
		courseName: null,
	}),
);
export type Curriculum = z.infer<typeof CurriculumSchema>;

//	区分
export const CategorySchema = withDefault(
	z
		.object({
			categoryId: z.string(),
			categoryName: z.string(),
			subjects: z.array(z.lazy(() => SubjectSchema).readonly()).readonly(),
			isOfficial: z.boolean(),
		})
		.readonly(),
	() => ({
		categoryId: "default",
		categoryName: "category.default",
		subjects: [],
		isOfficial: true,
	}),
);
export type Category = z.infer<typeof CategorySchema>;

//  教科
export const SubjectSchema = z
	.object({
		subjectId: z.string(),
		subjectName: z.string(),
		courses: z.array(z.lazy(() => CourseSchema).readonly()).readonly(),
	})
	.readonly();
export type Subject = z.infer<typeof SubjectSchema>;

//	科目
export const CourseSchema = z
	.object({
		courseId: z.string(),
		courseName: z.string(),
	})
	.readonly();
export type Course = z.infer<typeof CourseSchema>;
