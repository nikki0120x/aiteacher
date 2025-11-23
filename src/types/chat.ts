/* src\types\chat.ts */
// ================================================================
//     1. チャットの構成
// ================================================================

export type Part = {
	text?: string;
	inlineData?: { mimeType: string; data: string };
};

export type Content = {
	role: "user" | "model";
	parts: Part[];
};

// ================================================================
//     2. チャットの設定
// ================================================================

export type SliderState = {
	politeness?: number;
};

export type SwitchState = {
	summary?: boolean;
	guidance?: boolean;
	explanation?: boolean;
	answer?: boolean;
};

export type NormalizedSwitchState = Required<SwitchState>;

export type ImageSet = {
	problem?: string[];
};

// ================================================================
//     3. APIへの要求
// ================================================================

export type PostPayload = {
	prompt: string;
	sliders?: SliderState;
	options?: SwitchState;
	images?: ImageSet;
	history?: Content[];
	model: AIModel;
};

// ================================================================
//     4. アプリの状態
// ================================================================

export type ResponseMode = "learning" | "standard";

export type AIModel = "gemini-2.5-pro" | "gemini-3-pro-preview";

export type MessageItem = {
	id: string;
	text: string;
	role: "user" | "ai";
	timestamp: number;
	sectionsState?: NormalizedSwitchState;
};

export type ImageItem = {
	id: string;
	src: string;
	fileName: string;
};

export type ChatTurn = {
	user: MessageItem;
	model: MessageItem | undefined;
};
