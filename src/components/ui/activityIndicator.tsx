import type React from "react";
import { forwardRef } from "react";
import { cn } from "@/models/cn";

export interface ActivityIndicatorProps
	extends React.HTMLAttributes<HTMLDivElement> {}

const BARS = Array.from({ length: 8 }, (_, i) => ({
	id: `bar-${i}`,
	rotation: i * 45 - 90,
	delay: i * 0.1 - 0.8,
}));

export const ActivityIndicator = forwardRef<
	HTMLDivElement,
	ActivityIndicatorProps
>(({ className, ...props }, ref) => {
	return (
		<div
			ref={ref}
			role="status"
			aria-label="Loading"
			className={cn("relative inline-block size-6", className)}
			{...props}
		>
			<style>{`
					@keyframes activity-indicator-fade {
						0% { opacity: 1; }
						62.5% { opacity: 0.5; }
						100% { opacity: 0.5; }
					}
				`}</style>

			{BARS.map((bar) => (
				<div
					key={bar.id}
					className="absolute top-1/2 left-1/2 rounded-full bg-current colors"
					style={{
						width: "25%",
						height: "10%",
						opacity: 0.5,
						transform: `translate(-50%, -50%) rotate(${bar.rotation}deg) translate(100%, 0)`,
						animation: "activity-indicator-fade 0.8s linear infinite",
						animationDelay: `${bar.delay}s`,
					}}
				/>
			))}
		</div>
	);
});

ActivityIndicator.displayName = "ActivityIndicator";
