/* src\components\ui\InputTips.tsx */

import type { LucideIcon } from "lucide-react";
import type React from "react";
import { cn } from "@/utils/cn";

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
		"flex flex-row items-center p-2 w-full h-auto bg-transparent rounded-4xl transition-colors duration-250",
		wrapperClassName,
	);

	const dynamicIconClasses = cn(
		"shrink-0 mr-2 w-6 h-6 cursor-pointer",
		dynamicIconClassName,
	);

	const spanClasses = cn("text-base text-medium select-all", spanClassName);

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
