import { forwardRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/models/cn";
import { Input, Label } from "@/components/ui";

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, label, checked, defaultChecked, onChange, ...props }, ref) => {
        const [internalChecked, setInternalChecked] = useState(
            checked ?? defaultChecked ?? false
        );

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setInternalChecked(e.target.checked);
            if (onChange) {
                onChange(e);
            }
        };

        const isChecked = checked !== undefined ? checked : internalChecked;

        return (
            <Label
                className={cn(
                    "colors flex w-full cursor-pointer items-center justify-between gap-4 rounded-2xl p-2 hover:bg-l2 dark:hover:bg-d2",
                    "has-focus-visible:ring-2 has-focus-visible:ring-blue",
                    className
                )}
            >
                {label && (
                    <motion.span
                        layout
                        transition={{ duration: 0.5, ease: "backOut" }}
                        className="colors font-medium text-base text-d1 dark:text-l1"
                    >
                        {label}
                    </motion.span>
                )}

                <div
                    className={cn(
                        "colors flex w-14 h-8 items-center rounded-full p-1",
                        isChecked ? "bg-blue justify-end" : "bg-l5 dark:bg-d5 justify-start"
                    )}
                >
                    <Input
                        ref={ref}
                        type="checkbox"
                        checked={isChecked}
                        onChange={handleChange}
                        className="sr-only"
                        {...props}
                    />

                    <motion.div
                        layout
                        transition={{ duration: 0.5, ease: "backOut" }}
                        className="h-full aspect-square rounded-full bg-l1 shadow-lg colors"
                    />
                </div>
            </Label>
        );
    }
);

Switch.displayName = "Switch";