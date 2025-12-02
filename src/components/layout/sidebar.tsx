/* src\components\layout\sidebar.tsx */
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, easeOut } from "motion/react";
import { Button } from "@heroui/react";
import { Menu, SquarePen, CircleUserRound, Settings } from "lucide-react";
import { useChatStore } from "@/stores/useChat";
import { useAuthStore } from "@/stores/useAuth";

export default function Sidebar() {
	// ---------- 共通状態管理 ---------- //

	const {
		abortController,
		setIsSent,
		setIsLoading,
		setActiveContent,
		clearMessage,
		setAbortController,
	} = useChatStore();

	const { isLoggedIn, openModal } = useAuthStore();

	// ---------- メニュー ---------- //

	const [isOpen, setIsOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const [isSmallScreen, setIsSmallScreen] = useState(false);
	useEffect(() => {
		const checkScreens = () => {
			setIsMobile(window.innerWidth < 768);
			setIsSmallScreen(window.innerWidth < 448);
		};
		checkScreens();
		window.addEventListener("resize", checkScreens);
		return () => window.removeEventListener("resize", checkScreens);
	}, []);

	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setIsOpen(false);
			} else if (e.altKey && e.key.toLowerCase() === "m") {
				setIsOpen((prev) => !prev);
			}
		};

		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, []);

	// ---------- 新規チャット ---------- //

	const handleNewChat = () => {
		setIsSent(false);
		setIsLoading(false);
		setActiveContent(null);
		clearMessage();
		if (abortController) {
			abortController.abort();
			setAbortController(null);
		}
	};

	// ---------- フロントエンド ---------- //

	return (
		<div className="no-select">
			<Button
				aria-label="Menu Button"
				isIconOnly
				size="lg"
				radius="full"
				onPress={() => setIsOpen(!isOpen)}
				className={`fixed top-0 left-0 z-100 h-16 w-16 rounded-none text-d2 outline-none transition-all duration-250 hover:bg-l4 focus-visible:bg-l4 active:bg-l3 dark:text-l2 active:dark:bg-d3 focus-visible:dark:bg-d4 hover:dark:bg-d4 ${
					isOpen
						? "max-md:rounded-br-4xl max-md:bg-l2 md:rounded-br-4xl md:bg-l2 md:dark:bg-d2 max-md:dark:bg-d2"
						: "max-md:rounded-br-4xl max-md:bg-l1 md:rounded-none md:bg-l2 md:dark:bg-d2 max-md:dark:bg-d1"
				}`}
			>
				<Menu />
			</Button>
			<Button
				aria-label="New Chat Button"
				isIconOnly
				size="lg"
				radius="full"
				onPress={handleNewChat}
				className={`absolute top-0 right-0 z-100 h-16 w-16 rounded-none bg-l1 text-d2 outline-none transition-all duration-250 hover:bg-l4 focus-visible:bg-l4 active:bg-l3 dark:bg-d1 dark:text-l2 active:dark:bg-d3 focus-visible:dark:bg-d4 hover:dark:bg-d4 ${
					isOpen && isSmallScreen ? "rounded-bl-none" : "rounded-bl-4xl"
				}`}
			>
				<SquarePen />
			</Button>
			<AnimatePresence>
				{isOpen && isMobile && (
					<motion.div
						key="overlay"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.25, ease: easeOut }}
						onClick={() => setIsOpen(false)}
						className="fixed top-0 left-0 z-80 h-full w-full bg-ld/50 backdrop-blur-[2px]"
					/>
				)}
				<motion.aside
					key={`sidebar-${isMobile}`}
					initial={false}
					animate={{
						width: isOpen
							? isMobile
								? "min(calc(100vw - 4rem), 24rem)"
								: "24rem"
							: isMobile
								? 0
								: "4rem",
					}}
					exit={{ width: isMobile ? 0 : "4rem" }}
					transition={{ duration: 0.25, ease: easeOut }}
					className="flex h-full w-auto flex-col overflow-hidden bg-l2 max-md:fixed max-md:top-0 max-md:left-0 max-md:z-90 md:relative dark:bg-d2"
				>
					<div className="flex h-16 w-full flex-row items-center justify-between">
						<div className="h-full w-16 shrink-0 overflow-hidden"></div>
						{!isLoggedIn && (
							<Button
								aria-label="Account Button"
								className={`flex h-full w-auto flex-row items-center justify-start gap-4 overflow-hidden rounded-none bg-blue text-l1 outline-none transition-all duration-250 ${isOpen || isMobile ? "rounded-bl-4xl" : "rounded-bl-none"}`}
								onPress={openModal}
							>
								<CircleUserRound className="h-16 w-16 shrink-0 p-0.5" />
								<span className="font-black text-l1 text-lg">ログイン</span>
							</Button>
						)}
					</div>
					<div
						className={`flex h-full w-full flex-1 flex-col items-start justify-start p-4 transition-all duration-250 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
					>
						{!isLoggedIn && (
							<div className="flex h-auto w-88 flex-col gap-4 overflow-hidden rounded-2xl bg-l3 p-4 dark:bg-d3">
								<span className="select-text font-medium text-d3 text-lg dark:text-l3">
									ログインするとチャット履歴を保存できます。
									<br />
									ログイン後はここから最新のチャット履歴と作成したチャット履歴を利用できます。
								</span>
								<Button
									aria-label="Login Button"
									className="flex h-12 w-auto flex-row items-center justify-center gap-4 overflow-hidden rounded-4xl bg-blue outline-none transition-all duration-250"
									onPress={openModal}
								>
									<span className="font-black text-l1 text-lg">ログイン</span>
								</Button>
							</div>
						)}
					</div>
					<Button
						aria-label="Settings Button"
						className="flex h-16 w-full flex-row items-center justify-start gap-4 overflow-hidden rounded-none bg-transparent text-d2 outline-none hover:bg-l4 focus-visible:bg-l4 active:bg-l3 dark:text-l2 active:dark:bg-d3 focus-visible:dark:bg-d4 hover:dark:bg-d4"
					>
						<Settings className="h-16 w-16 shrink-0 p-0.5" />
						<span className="font-medium text-d2 text-lg dark:text-l2">
							設定
						</span>
					</Button>
				</motion.aside>
			</AnimatePresence>
		</div>
	);
}
