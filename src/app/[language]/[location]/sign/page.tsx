"use client";
import { LayoutGroup, motion } from "motion/react";
import Image from "next/image";
import { Sign } from "@/components/app/auth/sign";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

export default function SignPage() {
	const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

	return (
		<div className="colors relative inset-0 flex w-full h-[calc(100dvh-3.75rem)] select-none items-center justify-center bg-l1 p-2 dark:bg-d1">
			<GoogleReCaptchaProvider reCaptchaKey={siteKey}>
				<LayoutGroup>
					<motion.div
						layout
						initial={{ y: 32, opacity: 0, filter: "blur(1rem)" }}
						animate={{ y: 0, opacity: 1, filter: "blur(0)" }}
						exit={{ y: 32, opacity: 0, filter: "blur(1rem)" }}
						transition={{ duration: 0.5, ease: "backOut" }}
						className="colors flex lg:w-md max-lg:w-full max-h-full flex-col items-center justify-center p-2"
					>
						<div className="flex w-full items-center justify-center p-2">
							<Image
								src="/images/logos/webp/Logo_FoCalrina_small_theme.webp"
								alt="The FoCalrina Logo"
								width={120}
								height={40}
								priority
								className="object-contain"
							/>
						</div>

						<Sign />
					</motion.div>
				</LayoutGroup>
			</GoogleReCaptchaProvider>
		</div>
	);
}
