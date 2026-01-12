/* src\components\layout\toolbar.tsx */
"use client";
import {
	LayoutDashboard,
	MessageCircleMore,
	MessageSquareWarning,
	PenLine,
	Settings,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui";
import { useToolbarStore } from "@/stores/useToolbar";

export default function Toolbar() {
	const { isToolbarOpen, setToolbarOpen, toggleToolbar } = useToolbarStore();
	const router = useRouter();

	// ================================================================
	//     メニュー
	// ================================================================

	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setToolbarOpen(false);
			} else if (e.altKey && e.key.toLowerCase() === "m") {
				toggleToolbar();
			}
		};

		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [setToolbarOpen, toggleToolbar]);

	// ================================================================
	//     レスポンシブ
	// ================================================================

	const handleNavigation = (path: string) => {
		router.push(path);

		if (window.innerWidth < 1024) {
			setToolbarOpen(false);
		}
	};

	useEffect(() => {
		const mediaQuery = window.matchMedia("(min-width: 1024px)");

		const handleMediaQueryChange = () => {
			setToolbarOpen(false);
		};

		mediaQuery.addEventListener("change", handleMediaQueryChange);
		return () =>
			mediaQuery.removeEventListener("change", handleMediaQueryChange);
	}, [setToolbarOpen]);

	// ================================================================
	//     レンダリング
	// ================================================================

	return (
		<div className="no-select">
			<AnimatePresence>
				{isToolbarOpen && (
					<motion.div
						initial={{ opacity: 0, visibility: "hidden" }}
						animate={{ opacity: 1, visibility: "visible" }}
						exit={{ opacity: 0, visibility: "hidden" }}
						transition={{ duration: 0.25, ease: "easeInOut" }}
						onClick={() => setToolbarOpen(false)}
						className="lg:hidden absolute inset-0 z-20 size-full cursor-pointer bg-l1/50 dark:bg-d1/50"
					/>
				)}
			</AnimatePresence>
			<aside
				className={`
						box-content! flex overflow-hidden max-lg:absolute lg:relative max-lg:inset-0 lg:visible max-lg:z-20 flex-col justify-between items-center h-full border-l5 dark:border-d5 lg:border-r lg:opacity-100 transition-all duration-250 ease-in-out bg-l1 dark:bg-d1
                        ${
													isToolbarOpen
														? "w-[min(calc(100%-4rem),16rem)] lg:w-64 border-r visible opacity-100"
														: "w-0 lg:w-16 border-r-0 invisible opacity-0"
												}
					`}
			>
				<div className="flex flex-col flex-1 gap-1 justify-start items-center p-2 size-full">
					<Button
						aria-label="Dashboard Link Button"
						onClick={() => handleNavigation("/dashboard/")}
						className="flex justify-center items-center w-full h-12 rounded-2xl bg-l1 hover:bg-l2 dark:bg-d1 dark:hover:bg-d2"
					>
						<div className="flex flex-row justify-start items-center size-full">
							<LayoutDashboard className="shrink-0 m-3 size-6 text-d1 dark:text-l1" />
							<AnimatePresence>
								{isToolbarOpen && (
									<motion.span
										initial={{ x: -16, opacity: 0, visibility: "hidden" }}
										animate={{ x: 0, opacity: 1, visibility: "visible" }}
										exit={{ x: -16, opacity: 0, visibility: "hidden" }}
										transition={{ duration: 0.25, ease: "easeInOut" }}
										className="m-3 text-lg font-bold text-d1 dark:text-l1 text-left whitespace-nowrap"
									>
										ダッシュボード
									</motion.span>
								)}
							</AnimatePresence>
						</div>
					</Button>
					<hr className="my-2 w-full h-1 text-l5 dark:text-d5" />
					<Button
						aria-label="Chat Link Button"
						onClick={() => handleNavigation("/chat/")}
						className="flex justify-center items-center w-full h-12 rounded-2xl bg-l1 hover:bg-l2 dark:bg-d1 dark:hover:bg-d2"
					>
						<div className="flex flex-row justify-start items-center size-full">
							<MessageCircleMore className="shrink-0 m-3 size-6 text-d1 dark:text-l1" />
							<AnimatePresence>
								{isToolbarOpen && (
									<motion.span
										initial={{ x: -16, opacity: 0, visibility: "hidden" }}
										animate={{ x: 0, opacity: 1, visibility: "visible" }}
										exit={{ x: -16, opacity: 0, visibility: "hidden" }}
										transition={{ duration: 0.25, ease: "easeInOut" }}
										className="m-3 text-lg font-bold text-d1 dark:text-l1 text-left whitespace-nowrap"
									>
										質問
									</motion.span>
								)}
							</AnimatePresence>
						</div>
					</Button>
					<Button
						aria-label="Grade Link Button"
						onClick={() => handleNavigation("/grade/")}
						className="flex justify-center items-center w-full h-12 rounded-2xl bg-l1 hover:bg-l2 dark:bg-d1 dark:hover:bg-d2"
					>
						<div className="flex flex-row justify-start items-center size-full">
							<PenLine className="shrink-0 m-3 size-6 text-d1 dark:text-l1" />
							<AnimatePresence>
								{isToolbarOpen && (
									<motion.span
										initial={{ x: -16, opacity: 0, visibility: "hidden" }}
										animate={{ x: 0, opacity: 1, visibility: "visible" }}
										exit={{ x: -16, opacity: 0, visibility: "hidden" }}
										transition={{ duration: 0.25, ease: "easeInOut" }}
										className="m-3 text-lg font-bold text-d1 dark:text-l1 text-left whitespace-nowrap"
									>
										採点
									</motion.span>
								)}
							</AnimatePresence>
						</div>
					</Button>
					<hr className="my-2 w-full h-1 text-l5 dark:text-d5" />
				</div>
				<div className="flex flex-col flex-0 gap-1 justify-end items-center p-2 size-full border-l5 dark:border-d5 border-t">
					<Button
						aria-label="Feedback Link Button"
						onClick={() => handleNavigation("/feedback/")}
						className="flex justify-center items-center w-full h-12 rounded-2xl bg-l1 hover:bg-l2 dark:bg-d1 dark:hover:bg-d2"
					>
						<div className="flex flex-row justify-start items-center size-full">
							<MessageSquareWarning className="shrink-0 m-3 size-6 text-d1 dark:text-l1" />
							<AnimatePresence>
								{isToolbarOpen && (
									<motion.span
										initial={{ x: -16, opacity: 0, visibility: "hidden" }}
										animate={{ x: 0, opacity: 1, visibility: "visible" }}
										exit={{ x: -16, opacity: 0, visibility: "hidden" }}
										transition={{ duration: 0.25, ease: "easeInOut" }}
										className="m-3 text-lg font-bold text-d1 dark:text-l1 text-left whitespace-nowrap"
									>
										フィードバック
									</motion.span>
								)}
							</AnimatePresence>
						</div>
					</Button>
					<Button
						aria-label="Settings Link Button"
						onClick={() => handleNavigation("/settings/")}
						className="flex justify-center items-center w-full h-12 rounded-2xl bg-l1 hover:bg-l2 dark:bg-d1 dark:hover:bg-d2"
					>
						<div className="flex flex-row justify-start items-center size-full">
							<Settings className="shrink-0 m-3 size-6 text-d1 dark:text-l1" />
							<AnimatePresence>
								{isToolbarOpen && (
									<motion.span
										initial={{ x: -16, opacity: 0, visibility: "hidden" }}
										animate={{ x: 0, opacity: 1, visibility: "visible" }}
										exit={{ x: -16, opacity: 0, visibility: "hidden" }}
										transition={{ duration: 0.25, ease: "easeInOut" }}
										className="m-3 text-lg font-bold text-d1 dark:text-l1 text-left whitespace-nowrap"
									>
										設定
									</motion.span>
								)}
							</AnimatePresence>
						</div>
					</Button>
				</div>
			</aside>
		</div>
	);
}
