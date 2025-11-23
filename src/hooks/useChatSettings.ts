// src/hooks/useChatSettings.ts
import { useState } from "react";
import type { SharedSelection } from "@heroui/react";
import type { ResponseMode, AIModel } from "@/types/chat";

// ================================================================
//     1. 応答方式
// ================================================================

export const responseModes = {
	"standard": {
		label: "標準",
		description: "会話に適したモード",
	},
	"learning": {
		label: "学習",
		description: "問題解決に特化したモード",
	},
};

// ================================================================
//     2. AI の選択肢
// ================================================================

export const aiModels = {
	"gemini-3-pro-preview": {
		label: "Gemini 3 Pro Preview",
	},
	"gemini-2.5-pro": {
		label: "Gemini 2.5 Pro",
	},
	"gemini-2.5-flash": {
		label: "Gemini 2.5 Flash",
	},
	"gemini-2.5-flash-lite": {
		label: "Gemini 2.5 Flash Lite",
	}
};

// ================================================================
//     3. スイッチとスライダーの状態管理
// ================================================================

export type SwitchState = {
	summary: boolean;
	guidance: boolean;
	explanation: boolean;
	answer: boolean;
};

export type SliderState = {
	politeness: number;
};

// ================================================================
//     4. カスタムフック
// ================================================================

export const useChatSettings = () => {
	// ---------- 応答方式 ---------- //

	const [responseMode, setResponseMode] = useState<ResponseMode>("learning");

	const selectedModeLabel = responseModes[responseMode]?.label ?? "学習";

	const handleResponseModeSelection = (keys: SharedSelection) => {
		const selectedKey = Array.from(keys)[0] as ResponseMode;
		if (selectedKey === "standard" || selectedKey === "learning") {
			setResponseMode(selectedKey);
		}
	};

	// ---------- AI の選択肢 ---------- //

	const [aiModel, setAIModel] = useState<AIModel>("gemini-2.5-pro");

	const selectedModelLabel = aiModels[aiModel]?.label ?? "Gemini 2.5 Pro";

	const handleAIModelSelection = (keys: SharedSelection) => {
		const selectedKey = Array.from(keys)[0] as AIModel;
		if (selectedKey === "gemini-2.5-pro" || selectedKey === "gemini-3-pro-preview" || selectedKey === "gemini-2.5-flash" || selectedKey === "gemini-2.5-flash-lite") {
			setAIModel(selectedKey);
		}
	};

	// ---------- スイッチの状態管理 ---------- //

	const [switchState, setSwitchState] = useState<SwitchState>({
		summary: false,
		guidance: false,
		explanation: false,
		answer: true,
	});

	const handleSwitchChange = (key: keyof SwitchState) => {
		const currentlyTrueCount =
			Object.values(switchState).filter(Boolean).length;

		setSwitchState((prev) => {
			// 最後の1つがfalseになるのを防ぐ
			if (prev[key] && currentlyTrueCount === 1) return prev;
			return { ...prev, [key]: !prev[key] };
		});
	};

	// ---------- スライダーの状態管理 ---------- //

	const [sliders, setSliders] = useState<SliderState>({
		politeness: 0.5,
	});

	const handleSliderChange = (
		key: keyof SliderState,
		value: number | number[],
	) => {
		const numValue = Array.isArray(value) ? value[0] : value;
		setSliders((prev) => ({
			...prev,
			[key]: numValue,
		}));
	};

	return {
		responseMode,
		selectedModeLabel,
		handleResponseModeSelection,
		aiModel,
		selectedModelLabel,
		handleAIModelSelection,
		switchState,
		handleSwitchChange,
		sliders,
		handleSliderChange,
	};
};
