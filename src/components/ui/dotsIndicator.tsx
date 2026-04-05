import type React from "react";
import { forwardRef } from "react";
import { cn } from "@/models/cn";

export interface DotsIndicatorProps
	extends React.HTMLAttributes<HTMLDivElement> {}

const DOTS = Array.from({ length: 3 }, (_, i) => ({
	id: `dot-${i}`,
	delay: i * 0.1 - 0.7,
}));

export const DotsIndicator = forwardRef<HTMLDivElement, DotsIndicatorProps>(
	({ className, ...props }, ref) => {
		return (
			<div
				ref={ref}
				role="status"
				aria-label="Loading"
				className={cn(
					"flex flex-row items-center justify-center gap-2",
					className,
				)}
				{...props}
			>
				<style>{`
					@keyframes dot-indicator-fade {
						0% { opacity: 1; }
						71.43% { opacity: 0.5; }
						100% { opacity: 0.5; }
					}
				`}</style>

				{DOTS.map((dot) => (
					<div
						key={dot.id}
						className="size-2 flex-none rounded-full bg-current colors"
						style={{
							opacity: 0.5,
							animation: "dot-indicator-fade 0.7s linear infinite",
							animationDelay: `${dot.delay}s`,
						}}
					/>
				))}
			</div>
		);
	},
);

DotsIndicator.displayName = "DotsIndicator";
