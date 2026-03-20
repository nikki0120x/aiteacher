import { forwardRef, useState, useEffect } from "react";
import { cn } from "@/models/cn";
import { motion } from "motion/react";

export interface SliderMark {
    value: number;
    label?: string;
}

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> {
    label?: string;
    value?: number | string;
    marks?: SliderMark[];
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
    ({ className, label, min = 0, max = 100, value, defaultValue, onChange, marks, ...props }, ref) => {
        const [internalValue, setInternalValue] = useState(Number(value ?? defaultValue ?? min));

        useEffect(() => {
            if (value !== undefined) {
                setInternalValue(Number(value));
            }
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setInternalValue(Number(e.target.value));
            if (onChange) onChange(e);
        };

        const minNum = Number(min);
        const maxNum = Number(max);

        const ratio = Math.max(0, Math.min(1, (internalValue - minNum) / (maxNum - minNum)));
        const percentStr = `${Math.round(ratio * 100)}%`;

        const getPositionStyle = (val: number) => {
            const r = Math.max(0, Math.min(1, (val - minNum) / (maxNum - minNum)));
            return `calc(16px + ${r} * (100% - 32px))`;
        };

        const getFillStyle = (val: number) => {
            const r = Math.max(0, Math.min(1, (val - minNum) / (maxNum - minNum)));
            return {
                width: `calc(32px + ${r} * (100% - 32px))`,
            };
        };

        return (
            <div className="flex w-full flex-col gap-2">
                <div className="flex w-full items-center justify-between px-1">
                    {label && (
                        <label className="colors font-medium text-base text-d1 dark:text-l1">
                            {label}
                        </label>
                    )}

                    <span className="colors font-medium text-base text-d1 dark:text-l1">
                        {percentStr}
                    </span>
                </div>

                <div className="relative flex h-8 w-full items-center justify-center">
                    <div className="absolute inset-0 h-8 w-full rounded-full bg-l5 dark:bg-d5 overflow-hidden colors">
                        <div
                            className="h-full bg-blue rounded-full"
                            style={getFillStyle(internalValue)}
                        />
                    </div>

                    {marks?.map((mark) => {
                        const isCovered = mark.value <= internalValue;

                        return (
                            <div
                                key={mark.value}
                                className={cn(
                                    "absolute top-1/2 size-2 -translate-y-1/2 -translate-x-1/2 rounded-full colors",
                                    isCovered
                                        ? "bg-d5"
                                        : "bg-d5 dark:bg-l5"
                                )}
                                style={{ left: getPositionStyle(mark.value) }}
                            />
                        );
                    })}

                    <input
                        type="range"
                        ref={ref}
                        min={min}
                        max={max}
                        value={value}
                        defaultValue={defaultValue}
                        onChange={handleChange}
                        className={cn(
                            "colors relative z-10 mx-1 w-full cursor-pointer appearance-none bg-transparent outline-none",
                            "[&::-webkit-slider-runnable-track]:h-8 [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:bg-transparent",
                            "[&::-moz-range-track]:h-8 [&::-moz-range-track]:w-full [&::-moz-range-track]:bg-transparent",
                            "[&::-webkit-slider-thumb]:mt-1 [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-l1 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-transform active:[&::-webkit-slider-thumb]:scale-75",
                            "[&::-moz-range-thumb]:mt-1 [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-l1 [&::-moz-range-thumb]:shadow-lg hover:[&::-moz-range-thumb]:scale-110",
                            "focus-visible:ring-2 focus-visible:ring-blue rounded-full",
                            className
                        )}
                        {...props}
                    />
                </div>

                {marks && (
                    <div className="relative h-6 w-full ">
                        {marks?.map((mark) => mark.label && (
                            <span
                                className="absolute -translate-x-1/2 whitespace-nowrap text-center text-sm font-medium text-d5 dark:text-l5 colors"
                                style={{ left: getPositionStyle(mark.value) }}
                            >
                                {mark.label}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    }
);

Slider.displayName = "Slider";