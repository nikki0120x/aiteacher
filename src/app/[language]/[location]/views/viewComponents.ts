import { useRef } from "react";
import { useSettings } from "@/app/[language]/[location]/hooks/hookComponents";

export const useSettingsView = () => {
    // ================================================================
    //     Refs
    // ================================================================

    // スライダーやスイッチに直接フォーカスなどを当てたい場合のためのRef
    const sliderRef = useRef<HTMLInputElement>(null);
    const summarySwitchRef = useRef<HTMLInputElement>(null);
    const guidanceSwitchRef = useRef<HTMLInputElement>(null);
    const explanationSwitchRef = useRef<HTMLInputElement>(null);
    const answerSwitchRef = useRef<HTMLInputElement>(null);

    // ================================================================
    //     States & Actions
    // ================================================================

    const {
        states: {
            sliderState,
            switchState,
        },
        actions: {
            setSliderState,
            setSwitchState,
            updateSlider,
            updateSwitch,
        },
    } = useSettings();

    return {
        refs: {
            sliderRef,
            summarySwitchRef,
            guidanceSwitchRef,
            explanationSwitchRef,
            answerSwitchRef,
        },
        states: {
            sliderState,
            switchState,
        },
        actions: {
            setSliderState,
            setSwitchState,
            updateSlider,
            updateSwitch,
        },
    };
};