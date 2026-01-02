/* src\components\layout\transient.tsx */
"use client";
import { motion } from "motion/react";

export default function Transient({ children }: { children: React.ReactNode }) {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.5, ease: "easeOut" }}
			className="size-full"
		>
			{children}
		</motion.div>
	);
}
