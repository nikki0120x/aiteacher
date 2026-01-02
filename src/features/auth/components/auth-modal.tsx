/* src\features\auth\components\auth-modal.tsx */
"use client";
import { Button, Divider } from "@heroui/react";
import { X } from "lucide-react";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { useMediaQuery } from "react-responsive";
import { useAuthStore } from "@/stores/useAuth";
import SignInForm from "./signIn";
import SignUpForm from "./signUp";

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

	// ================================================================
	//     2. ドラッグ終了時の処理
	// ================================================================

	const [isDragging, setIsDragging] = useState(false);

	const VELOCITY_THRESHOLD = 500;

	const handleDragEnd = (_: unknown, info: PanInfo) => {
		setIsDragging(false);
		if (isMobile) {
			if (info.velocity.y > VELOCITY_THRESHOLD) {
				closeModal();
			}
		}
	};

	// ================================================================
	//     3. フォーム切り替え
	// ================================================================

	const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
	const switchToSignUp = () => setMode("signUp");
	const switchToSignIn = () => setMode("signIn");

	// ================================================================
	//     0. フロントエンド
	// ================================================================

	return (
		<div className="no-select">
			<AnimatePresence>
				{isModalOpen && (
					<motion.div
						key="auth-modal-overlay"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.25, ease: "easeInOut" }}
						className="flex fixed inset-0 z-500 justify-center max-md:items-end md:items-center size-full backdrop-blur-xs bg-l3/50 dark:bg-d3/50"
					>
						<motion.div
							key="auth-modal"
							variants={variants}
							initial="initial"
							animate="animate"
							exit="exit"
							transition={{ duration: 0.25, ease: "easeInOut" }}
							drag={isMobile ? "y" : false}
							dragConstraints={isMobile ? { top: 0 } : false}
							onDragStart={() => setIsDragging(true)}
							onDragEnd={handleDragEnd}
							dragElastic={{ top: 0, bottom: 0.5 }}
							dragSnapToOrigin={true}
							dragTransition={{
								bounceStiffness: 1000,
								bounceDamping: 100,
							}}
							onMouseDown={(e) => e.stopPropagation()}
							className={`flex relative z-500 flex-col justify-start items-center p-4 md:w-md max-md:w-full max-h-[75%] md:rounded-4xl max-md:rounded-t-4xl bg-l2 dark:bg-d2
								${
									isMobile
										? isDragging
											? "cursor-grabbing"
											: "cursor-grab"
										: ""
								}`}
						>
							{isMobile && (
								<Divider
									orientation="horizontal"
									className={`mb-4 w-16 h-1 rounded-4xl transition-colors duration-250 ${isDragging ? "bg-d2 dark:bg-l2" : "bg-ld"}`}
								/>
							)}
							<div className="flex relative justify-center items-center w-full h-16">
								<Image
									src="/images/logos/webp/Logo_AITeacher_large_dark.webp"
									alt="The AITeacher Logo"
									width={160}
									height={40}
									className="dark:hidden object-contain"
								/>
								<Image
									src="/images/logos/webp/Logo_AITeacher_large_light.webp"
									alt="The AITeacher Logo"
									width={160}
									height={40}
									className="dark:block hidden object-contain"
								/>
								<Button
									aria-label="Close Modal"
									isIconOnly
									onPress={closeModal}
									className="absolute right-0 w-12 h-12 text-d2 dark:text-l2 rounded-4xl transition-colors duration-250 bg-l2 hover:bg-l4 focus-visible:bg-l4 active:bg-l3 dark:bg-d2 hover:dark:bg-d4 focus-visible:dark:bg-d4 active:dark:bg-d3"
								>
									<X size="24" />
								</Button>
							</div>
							{mode === "signIn" ? (
								<SignInForm
									closeModal={closeModal}
									switchToSignUp={switchToSignUp}
								/>
							) : (
								<SignUpForm
									closeModal={closeModal}
									switchToSignIn={switchToSignIn}
								/>
							)}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
