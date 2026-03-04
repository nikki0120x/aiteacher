import type React from "react";
import { forwardRef } from "react";
import { Ripple, useRipple } from "@/components/parts/ripple";
import { cn } from "@/models/cn";

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	ripple?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{ type = "button", ripple = true, onClick, className, children, ...props },
		ref,
	) => {
		const { ripples, triggerRipple } = useRipple();

		const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
			if (ripple) {
				triggerRipple(e);
			}

			onClick?.(e);
		};

		const buttonClass = cn(
			"overflow-hidden relative outline-none cursor-pointer",
			"focus-visible:ring-2 focus-visible:ring-blue",
			"active:[&>*:not(:first-child)]:scale-75",
			className,
		);

		return (
			<button
				{...props}
				ref={ref}
				type={type}
				onClick={handleClick}
				className={buttonClass}
			>
				{ripple && <Ripple ripples={ripples} />}
				{children}
			</button>
		);
	},
);

Button.displayName = "Button";
