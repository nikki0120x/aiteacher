import { useCallback, useMemo, useState } from "react";
import {
    type SliderState,
    SliderStateSchema,
    type SwitchState,
    SwitchStateSchema,
} from "@/models/modelChat";

export const useSettings = () => {
    const [sliderState, setSliderState] = useState<SliderState>(
        SliderStateSchema.createDefault(),
    );
    const [switchState, setSwitchState] = useState<SwitchState>(
        SwitchStateSchema.createDefault(),
    );
    const [teachingMode, setTeachingMode] = useState<"choices" | "description">("choices");

    const updateSlider = useCallback((value: number) => {
        setSliderState((prev) => ({
            ...prev,
            politeness: value,
        }));
    }, []);

    const updateSwitch = useCallback((key: keyof SwitchState, checked: boolean) => {
        setSwitchState((prev) => ({
            ...prev,
            [key]: checked,
        }));
    }, []);

    const updateTeachingMode = useCallback((mode: "choices" | "description") => {
        setTeachingMode(mode);
    }, []);

    const actions = useMemo(
        () => ({
            setSliderState,
            setSwitchState,
            setTeachingMode,
            updateSlider,
            updateSwitch,
            updateTeachingMode,
        }),
        [updateSlider, updateSwitch, updateTeachingMode],
    );

    return {
        states: {
            sliderState,
            switchState,
            teachingMode,
        },
        actions,
    };
};