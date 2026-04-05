"use client";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Auth } from "@/components/app/auth/auth";
import { useRouter } from "@/i18n/routing";

const MODE_MAP: Record<string, string> = {
	signin: "sign-in",
	signup: "sign-up",
	signout: "sign-out",
};

export default function SignModal() {
	const [isModalOpen, setIsModalOpen] = useState(true);
	const [loadingState, setLoadingState] = useState({
		isSubmitting: false,
		isAuthenticating: false,
	});

	const router = useRouter();
	const t = useTranslations("auth");
	const searchParams = useSearchParams();
	const mode = searchParams.get("mode") || "signin";

	const handleModalClose = () => {
		setIsModalOpen(false);
	};

	useEffect(() => {
		let titleText = "";

		if (loadingState.isSubmitting) {
			titleText = t("title.submitting");
		} else if (loadingState.isAuthenticating) {
			titleText = t("title.authenticating");
		} else {
			const key = MODE_MAP[mode] || MODE_MAP.signin;
			titleText = t(`title.${key}`);
		}

		document.title = titleText;
	}, [mode, loadingState, t]);

	return (
		<div className="colors relative inset-0 flex w-full h-[calc(100dvh-3.75rem)] select-none items-center justify-center bg-l1 p-2 dark:bg-d1">
			<LayoutGroup>
				<AnimatePresence
					onExitComplete={() => {
						if (!isModalOpen) {
							router.refresh();
							router.push("/");
						}
					}}
				>
					{isModalOpen && (
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
									className="w-30 h-10 object-contain"
								/>
							</div>

							<Auth
								onSuccess={handleModalClose}
								onLoadingChange={setLoadingState}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</LayoutGroup>
		</div>
	);
}
