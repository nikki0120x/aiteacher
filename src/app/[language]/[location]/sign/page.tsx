"use client";
import { Sign } from "@/components/app/auth/sign";
import { motion, LayoutGroup } from "motion/react";
import Image from "next/image";

export default function SignPage() {
	return (
		<div className="colors relative inset-0 flex w-full h-[calc(100dvh-3.75rem)] select-none items-center justify-center bg-l1 p-2 dark:bg-d1">
			<LayoutGroup>
				<motion.div
					layout
					initial={{ y: 32, opacity: 0, filter: "blur(1rem)" }}
					animate={{ y: 0, opacity: 1, filter: "blur(0)" }}
					exit={{ y: 32, opacity: 0, filter: "blur(1rem)" }}
					transition={{ duration: 0.5, ease: "backOut" }}
					className="colors flex lg:w-md max-lg:w-full max-h-full flex-col items-center justify-center p-2"
				>
					<div className="flex w-full flex-row items-center justify-center">
						<Image
							src="/images/logos/webp/Logo_AITeacher_small_theme.webp"
							alt="The AITeacher Logo"
							width={160}
							height={40}
							priority
							className="w-30 h-10 object-contain"
						/>
					</div>

					<Sign />
				</motion.div>
			</LayoutGroup>
		</div>
	);
}