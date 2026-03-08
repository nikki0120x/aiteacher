import { useCallback, useMemo, useState } from "react";
import {
    type SliderState,
    SliderStateSchema,
    type SwitchState,
    SwitchStateSchema,
} from "@/models/modelChat";

export const useSettings = () => {
    // State: modelChat.tsのスキーマから初期値を生成
    const [sliderState, setSliderState] = useState<SliderState>(
        SliderStateSchema.createDefault(),
    );
    const [switchState, setSwitchState] = useState<SwitchState>(
        SwitchStateSchema.createDefault(),
    );

    // Action: スライダーの更新ロジック
    const updateSlider = useCallback((value: number) => {
        setSliderState((prev) => ({
            ...prev,
            politeness: value,
        }));
    }, []);

    // Action: スイッチの更新ロジック
    const updateSwitch = useCallback((key: keyof SwitchState, checked: boolean) => {
        setSwitchState((prev) => ({
            ...prev,
            [key]: checked,
        }));
    }, []);

    const actions = useMemo(
        () => ({
            setSliderState,
            setSwitchState,
            updateSlider,
            updateSwitch,
        }),
        [updateSlider, updateSwitch],
    );

    return {
        states: {
            sliderState,
            switchState,
        },
        actions,
    };
};