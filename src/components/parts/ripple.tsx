/* src\components\parts\ripple.tsx */
import type React from "react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { cn } from "@/utils/cn";

type RippleType = {
	x: number;
	y: number;
	key: number;
	size: number;
};

export const useRipple = () => {
	const [ripples, setRipples] = useState<RippleType[]>([]);

	const triggerRipple = useCallback((e: React.MouseEvent<HTMLElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const w = rect.width;
		const h = rect.height;

		const isKeyboardClick =
			e.detail === 0 || (e.clientX === 0 && e.clientY === 0);

		let x: number;
		let y: number;

		if (isKeyboardClick) {
			x = w / 2;
			y = h / 2;
		} else {
			x = e.clientX - rect.left;
			y = e.clientY - rect.top;
		}

		const distTopLeft = Math.hypot(x, y);
		const distTopRight = Math.hypot(w - x, y);
		const distBottomLeft = Math.hypot(x, h - y);
		const distBottomRight = Math.hypot(w - x, h - y);

		const maxDist = Math.max(
			distTopLeft,
			distTopRight,
			distBottomLeft,
			distBottomRight,
		);
		const size = maxDist * 2;

		const newRipple: RippleType = {
			x,
			y,
			key: Date.now(),
			size,
		};

		setRipples((prev) => [...prev, newRipple]);
	}, []);

	useLayoutEffect(() => {
		if (ripples.length > 0) {
			const timer = setTimeout(() => {
				setRipples((prev) => prev.slice(1));
			}, 1000);

			return () => clearTimeout(timer);
		}
	}, [ripples]);

	return { ripples, triggerRipple };
};

const RippleEffect = ({
	x,
	y,
	size,
	color,
}: Omit<RippleType, "key"> & { color: string }) => {
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsAnimating(true);
		}, 10);

		return () => clearTimeout(timer);
	}, []);

	return (
		<span
			className={cn(
				"overflow-hidden absolute z-1000 rounded-full pointer-events-none",
				"transition-all duration-500 ease-out",
				color,
				isAnimating ? "opacity-0 scale-100" : "opacity-50 scale-0",
			)}
			style={{
				width: size,
				height: size,
				top: y - size / 2,
				left: x - size / 2,
			}}
		/>
	);
};

type RippleProps = {
	ripples: RippleType[];
	className?: string;
	color?: string;
};

export const Ripple = ({
	ripples,
	className,
	color = "bg-d1 dark:bg-l1",
}: RippleProps) => {
	return (
		<span className={className}>
			{ripples.map(({ key, ...rest }) => (
				<RippleEffect key={key} {...rest} color={color} />
			))}
		</span>
	);
};
