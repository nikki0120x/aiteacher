import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { useCallback } from "react";

gsap.registerPlugin(SplitText);

//	テキスト分割
export const useTextSplit = (
	textSplitRef: React.RefObject<HTMLElement | null>,
) => {
	const textSplit = useCallback(() => {
		if (!textSplitRef.current) return;

		const split = new SplitText(textSplitRef.current, { type: "chars" });
		const ctx = gsap.context(() => {
			gsap.from(split.chars, {
				y: 32,
				opacity: 0,
				stagger: 0.025,
				duration: 0.5,
				ease: "back.out(1.5)",
				onComplete: () => {
					gsap.delayedCall(0.5, () => {
						split.revert();
					});
				},
			});
		}, textSplitRef);

		return () => {
			ctx.revert();
			split.revert();
		};
	}, [textSplitRef]);

	return { textSplit };
};
