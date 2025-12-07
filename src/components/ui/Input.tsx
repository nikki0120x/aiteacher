/* src\components\ui\Input.tsx */
import {
    useState,
    useEffect,
    useRef,
    useCallback,
    forwardRef,
    type MouseEvent,
    type ChangeEvent,
} from "react";
import type React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import type { LucideIcon } from "lucide-react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    Icon: LucideIcon;
    label: string;
    rightContent?: React.ReactNode;
    wrapperClassName?: string;
    inputClassName?: string;
    dynamicIconClassName?: string;
    labelClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            Icon,
            label,
            wrapperClassName,
            inputClassName,
            dynamicIconClassName,
            labelClassName,
            rightContent,
            onFocus,
            onBlur,
            onChange,
            ...props
        },
        ref,
    ) => {
        const DynamicIcon = Icon;

        const [isFocused, setIsFocused] = useState(false);
        const [hasValue, setHasValue] = useState(
            !!props.value || !!props.defaultValue,
        );

        useEffect(() => {
            if (props.value !== undefined) {
                setHasValue(String(props.value).length > 0);
            }
        }, [props.value]);

        const wrapperRef = useRef<HTMLDivElement>(null);
        const [ripple, setRipple] = useState<{
            x: number;
            y: number;
            key: number;
            scale: number;
        } | null>(null);

        // ================================================================
        //     イベントハンドラ
        // ================================================================

        const handleWrapperMouseDown = (event: MouseEvent<HTMLDivElement>) => {
            if (isFocused) return;

            if (wrapperRef.current) {
                const rect = wrapperRef.current.getBoundingClientRect();

                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                const width = rect.width;
                const height = rect.height;

                const dist1 = Math.hypot(x, y);
                const dist2 = Math.hypot(width - x, y);
                const dist3 = Math.hypot(x, height - y);
                const dist4 = Math.hypot(width - x, height - y);

                const maxDistance = Math.max(dist1, dist2, dist3, dist4);
                const RIPPLE_SIZE = 20;
                const scale = (maxDistance * 2) / RIPPLE_SIZE;

                setRipple({ x, y, scale, key: Date.now() });
            }
        };

        const handleFocus = useCallback(
            (event: React.FocusEvent<HTMLInputElement>) => {
                setIsFocused(true);
                onFocus?.(event);
            },
            [onFocus],
        );

        const handleBlur = useCallback(
            (event: React.FocusEvent<HTMLInputElement>) => {
                setIsFocused(false);
                onBlur?.(event);
            },
            [onBlur],
        );

        const handleChange = useCallback(
            (event: ChangeEvent<HTMLInputElement>) => {
                setHasValue(event.target.value.length > 0);
                onChange?.(event);
            },
            [onChange],
        );

        const shouldShrink = isFocused || hasValue;

        // ================================================================
        //     Classes
        // ================================================================

        const wrapperClasses = cn(
            "relative flex flex-row items-center w-full h-14 rounded-4xl overflow-hidden transition-colors duration-250",
            "group",
            wrapperClassName,
        );

        const inputClasses = cn(
            "pt-3 pl-12 pr-6 w-full h-full rounded-4xl border-1 outline-none text-base text-medium transition-colors duration-250",
            "bg-transparent border-ld text-d1 dark:text-l1 group-hover:border-blue",
            inputClassName,
        );

        const dynamicIconClasses = cn(
            "absolute left-4 shrink-0 w-6 h-6 cursor-pointer transition-colors duration-250",
            "text-d1 dark:text-l1 group-hover:text-blue!",
            dynamicIconClassName,
        );

        const labelClasses = cn(
            "absolute z-100 left-0 top-1/2 left-12 -translate-y-1/2 text-base transition-all duration-250 pointer-events-none",
            "text-ld group-hover:text-blue!",

            shouldShrink && "top-3 text-xs",

            isFocused && "text-d1 dark:text-l1",
            !isFocused && hasValue && "text-d1 dark:text-l1",
            labelClassName,
        );

        const rightContentClasses = cn(
            "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10",
        );

        // ================================================================
        //     フロントエンド
        // ================================================================

        return (
            <motion.div
                className={wrapperClasses}
                ref={wrapperRef}
                onMouseDown={handleWrapperMouseDown}
            >
                <input
                    className={inputClasses}
                    ref={ref}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    {...props}
                />
                <DynamicIcon className={dynamicIconClasses} />
                <span className={labelClasses}>{label}</span>
                {rightContent && (
                    <div className={rightContentClasses}>{rightContent}</div>
                )}
                <AnimatePresence>
                    {ripple && (
                        <motion.span
                            key={ripple.key}
                            initial={{
                                x: ripple.x,
                                y: ripple.y,
                                scale: 0,
                                opacity: 0.5,
                            }}
                            animate={{
                                scale: ripple.scale,
                                opacity: 0,
                                transition: {
                                    duration: 1,
                                    ease: "easeOut",
                                },
                            }}
                            exit={{
                                opacity: 0,
                                transition: { duration: 0.2 },
                            }}
                            onAnimationComplete={() => {
                                setRipple(null);
                            }}
                            style={{
                                position: "absolute",
                                borderRadius: "50%",
                                backgroundColor: "oklch(0.5 0 0)",
                                width: "2rem",
                                height: "2rem",
                                pointerEvents: "none",
                                translateX: "-50%",
                                translateY: "-50%",
                            }}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        );
    },
);
