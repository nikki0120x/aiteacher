// src/hooks/useChatSettings.ts
import { useState } from "react";
import type { SharedSelection } from "@heroui/react";
import type { ResponseMode } from "@/types/chat";

// ================================================================
//     1. 
// ================================================================

export const responseModes = {
	standard: {
		label: "標準",
		description: "会話に適したモード",
	},
	learning: {
		label: "学習",
		description: "問題解決に特化したモード",
	},
};

// ================================================================
//     1.
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
//     1.
// ================================================================

export const useChatSettings = () => {
	// ---------- 応答方式 ---------- //

	const [responseMode, setResponseMode] = useState<ResponseMode>("learning");

	const selectedModeLabel = responseModes[responseMode]?.label ?? "標準";

	const handleResponseModeSelection = (keys: SharedSelection) => {
		const selectedKey = Array.from(keys)[0] as ResponseMode;
		if (selectedKey === "standard" || selectedKey === "learning") {
			setResponseMode(selectedKey);
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
		switchState,
		handleSwitchChange,
		sliders,
		handleSliderChange,
	};
};
