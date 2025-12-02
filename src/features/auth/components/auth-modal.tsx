/* src\features\auth\components\auth-modal.tsx */
"use client";
import { useState } from "react";
import { useMediaQuery } from "react-responsive";
import { motion, AnimatePresence, easeOut } from "motion/react";
import { useAuthStore } from "@/stores/useAuth";
import { Button, Input } from "@heroui/react";
import { X, Mail, KeyRound, Eye, EyeClosed } from "lucide-react";

export default function AuthModal() {
	const { isModalOpen, closeModal } = useAuthStore();

	// ================================================================
	//     1. auth-modal デスクトップ / モバイル 切り替え
	// ================================================================

	const mobileVariants = {
		initial: { translateY: "100%" },
		animate: { translateY: 0 },
		exit: { translateY: "100%" },
	};

	const desktopVariants = {
		initial: { translateY: 50 },
		animate: { translateY: 0 },
		exit: { translateY: 50 },
	};

	const isMobile = useMediaQuery({ maxWidth: 768 });
	const variants = isMobile ? mobileVariants : desktopVariants;

	const [isVisible, setIsVisible] = useState(false);

	const toggleVisibility = () => setIsVisible(!isVisible);

	// ---------- フロントエンド ---------- //

	return (
		<div className="no-select">
			<AnimatePresence>
				{isModalOpen && (
					<motion.div
						key="auth-modal-overlay"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.25, ease: easeOut }}
						onClick={closeModal}
						className="fixed inset-0 z-500 flex h-full w-full justify-center bg-ld/50 backdrop-blur-[2px] max-md:items-end md:items-center"
					>
						<motion.div
							key="auth-modal"
							variants={variants}
							initial="initial"
							animate="animate"
							exit="exit"
							transition={{ duration: 0.25, ease: easeOut }}
							onClick={(e) => e.stopPropagation()}
							className="flex h-[75%] max-h-[calc(448px*1.25)] flex-col items-center justify-start gap-12 bg-l2 p-4 max-md:w-full max-md:rounded-t-4xl md:w-md md:rounded-4xl dark:bg-d2"
						>
							<div className="relative flex h-12 w-full items-center justify-center rounded-2xl">
								<span className="font-bold text-2xl text-d2 dark:text-l2">
									ログイン
								</span>
								<Button
									aria-label="Close Modal"
									isIconOnly
									onPress={closeModal}
									className="absolute right-0 h-12 w-12 rounded-2xl bg-l2 text-d2 transition-all duration-250 hover:bg-l4 focus-visible:bg-l4 active:bg-l3 dark:bg-d2 dark:text-l2 active:dark:bg-d3 focus-visible:dark:bg-d4 hover:dark:bg-d4"
								>
									<X size="24" />
								</Button>
							</div>
							<div className="flex h-auto w-full flex-col items-center justify-start gap-6">
								<Input
									isRequired
									label="メールアドレス"
									type="email"
									className="[&>div]:rounded-2xl [&>div]:bg-l3 [&>div]:dark:bg-d3"
								/>
								<Input
									isRequired
									label="パスワード"
									type={isVisible ? "text" : "password"}
									endContent={
										<Button
											aria-label="Toggle password visibility"
											isIconOnly
											onPress={toggleVisibility}
											className="h-full w-auto rounded-2xl bg-transparent text-d3 transition-all duration-250 dark:text-l3"
										>
											{isVisible ? <Eye size="20" /> : <EyeClosed size="20" />}
										</Button>
									}
									className="[&>div]:rounded-2xl [&>div]:bg-l3 [&>div]:dark:bg-d3"
								/>
							</div>
							<div className="flex h-auto w-full flex-col items-center justify-start">
								<Button
									aria-label="Send login information"
									className="h-16 w-full rounded-2xl bg-blue text-l1 transition-all duration-250"
								>
									<span className="text-xl font-medium">ログイン</span>
								</Button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
