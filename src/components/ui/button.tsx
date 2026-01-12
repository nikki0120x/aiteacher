/* src\components\ui\button.tsx */
import type React from "react";
import { Ripple, useRipple } from "@/components/parts/ripple";
import { cn } from "@/utils/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({
	children,
	onClick,
	className,
	...props
}: ButtonProps) => {
	const { ripples, triggerRipple } = useRipple();

	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		triggerRipple(e);

		if (onClick) {
			onClick(e);
		}
	};

	// ================================================================
	//     Classes
	// ================================================================

	const buttonClasses = cn(
		"flex overflow-hidden relative outline-none focus-visible:ring-2 focus-visible:ring-blue backdrop-blur-lg transition-colors duration-250 ease-in-out cursor-pointer group",
		"[&>*:not(:first-child)]:transition-transform [&>*:not(:first-child)]:duration-250 [&>*:not(:first-child)]:ease-in-out active:[&>*:not(:first-child)]:scale-75",
		className,
	);

	// ================================================================
	//     レンダリング
	// ================================================================

	return (
		<button
			type="button"
			className={buttonClasses}
			onClick={handleClick}
			{...props}
		>
			<Ripple ripples={ripples} />
			{children}
		</button>
	);
};
