/* src\components\ui\InputTips.tsx */
import type React from "react";
import { cn } from "@/utils/cn";
import type { LucideIcon } from "lucide-react";

type InputTipsProps = React.InputHTMLAttributes<HTMLInputElement> & {
	Icon: LucideIcon;
	spanText: string;
	wrapperClassName?: string;
	dynamicIconClassName?: string;
	spanClassName?: string;
};

export const InputTips = ({
	Icon,
	spanText,
	wrapperClassName,
	dynamicIconClassName,
	spanClassName,
}: InputTipsProps) => {
	const DynamicIcon = Icon;

	// ================================================================
	//     Classes
	// ================================================================

	const wrapperClasses = cn(
		"p-2 flex flex-row items-center w-full h-auto rounded-4xl bg-transparent transition-colors duration-250",
		wrapperClassName,
	);

	const dynamicIconClasses = cn(
		"mr-2 shrink-0 w-6 h-6 cursor-pointer",
		dynamicIconClassName,
	);

	const spanClasses = cn("select-all text-base text-medium", spanClassName);

	// ================================================================
	//     フロントエンド
	// ================================================================

	return (
		<div className={wrapperClasses}>
			<DynamicIcon className={dynamicIconClasses} />
			<span className={spanClasses}>{spanText}</span>
		</div>
	);
};
