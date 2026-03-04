import type React from "react";
import { forwardRef } from "react";
import { cn } from "@/models/cn";

export interface LabelProps
	extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
	({ onClick, className, children, ...props }, ref) => {
		const labelClass = cn("overflow-hidden relative cursor-pointer", className);

		return (
			<label {...props} ref={ref} className={labelClass}>
				{children}
			</label>
		);
	},
);

Label.displayName = "Label";
