/* src/hooks/useHorizontalScroll.ts */
import { useCallback, useRef } from "react";

export const useHorizontalScroll = <T extends HTMLElement>() => {
	const cleanupRef = useRef<(() => void) | null>(null);

	const refCallback = useCallback((node: T | null) => {
		if (cleanupRef.current) {
			cleanupRef.current();
			cleanupRef.current = null;
		}

		if (node) {
			const handleWheel = (e: WheelEvent) => {
				const isScrollable = node.scrollWidth > node.clientWidth;

				if (isScrollable && e.deltaY !== 0) {
					const { scrollLeft, scrollWidth, clientWidth } = node;

					const isAtStart = scrollLeft <= 0 && e.deltaY < 0;
					const isAtEnd =
						scrollLeft + clientWidth >= scrollWidth && e.deltaY > 0;

					if (!isAtStart && !isAtEnd) {
						node.scrollLeft += e.deltaY;
						if (e.cancelable) {
							e.preventDefault();
						}
					}
				}
			};

			node.addEventListener("wheel", handleWheel, { passive: false });

			cleanupRef.current = () => {
				node.removeEventListener("wheel", handleWheel);
			};
		}
	}, []);

	return refCallback;
};
