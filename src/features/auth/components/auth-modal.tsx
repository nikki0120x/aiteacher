/* src\features\auth\components\auth-modal.tsx */
"use client";
import { useState } from "react";
import { useMediaQuery } from "react-responsive";
import { motion, AnimatePresence, easeOut, type PanInfo } from "motion/react";
import { useAuthStore } from "@/stores/useAuth";
import { Divider, Button } from "@heroui/react";
import { X } from "lucide-react";
import Image from "next/image";
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

	const [mode, setMode] = useState<"login" | "register">("login");
	const switchToSignUp = () => setMode("register");
	const switchToSignIn = () => setMode("login");

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
						transition={{ duration: 0.25, ease: easeOut }}
						onMouseDown={closeModal}
						className="fixed z-500 flex h-full w-full justify-center bg-l3/50 backdrop-blur-[2px] max-md:items-end md:items-center dark:bg-d3/50"
					>
						<motion.div
							key="auth-modal"
							variants={variants}
							initial="initial"
							animate="animate"
							exit="exit"
							transition={{ duration: 0.25, ease: easeOut }}
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
							className={`relative z-500 flex h-[75%] max-h-[calc(448px*1.25)] flex-col items-center justify-start overflow-y-auto overflow-x-hidden bg-l2 p-8 shadow-ld shadow-lg/50 max-md:w-full max-md:rounded-t-4xl md:w-md md:rounded-4xl dark:bg-d2 ${isMobile ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""}`}
						>
							{isMobile && (
								<Divider
									orientation="horizontal"
									className={`mb-4 h-1 w-16 rounded-4xl transition-colors duration-250 ${isDragging ? "bg-d2 dark:bg-l2" : "bg-ld"}`}
								/>
							)}
							<div className="relative flex h-16 w-full items-center justify-center">
								<Image
									src="/logos/dark.webp"
									alt="Logo (Dark)"
									width={96}
									height={128}
									className="object-contain dark:hidden"
								/>
								<Image
									src="/logos/light.webp"
									alt="Logo (Light)"
									width={96}
									height={96}
									className="hidden object-contain dark:block"
								/>
								<Button
									aria-label="Close Modal"
									isIconOnly
									onPress={closeModal}
									className="absolute right-0 h-12 w-12 rounded-2xl bg-l2 text-d2 transition-all duration-250 hover:bg-l4 focus-visible:bg-l4 active:bg-l3 dark:bg-d2 dark:text-l2 active:dark:bg-d3 focus-visible:dark:bg-d4 hover:dark:bg-d4"
								>
									<X size="24" />
								</Button>
							</div>
							{mode === "login" ? (
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
