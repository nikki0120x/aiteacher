/* src\components\layout\sidebar.tsx */
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, easeInOut } from "motion/react";
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

	const {
		isLoggedIn,
		openModal,
	} = useAuthStore();

	// ---------- メニュー ---------- //

	const [isOpen, setIsOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const [isSmallScreen, setIsSmallScreen] = useState(false);
	useEffect(() => {
		const checkScreens = () => {
			setIsMobile(window.innerWidth < 1024);
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
				className={`fixed top-0 left-0 z-100 w-16 h-16 rounded-none transition-all duration-500 outline-none bg-l1 dark:bg-d1 hover:bg-l4 hover:dark:bg-d4 active:bg-l3 active:dark:bg-d3 focus-visible:bg-l4 focus-visible:dark:bg-d4 text-d2 dark:text-l2 ${isOpen || isMobile ? "rounded-br-4xl" : "rounded-br-none"}`}
			>
				<Menu />
			</Button>
			<Button
				aria-label="New Chat Button"
				isIconOnly
				size="lg"
				radius="full"
				onPress={handleNewChat}
				className={`absolute top-0 right-0 z-100 w-16 h-16 rounded-none transition-all duration-500 outline-none bg-l1 dark:bg-d1 hover:bg-l4 hover:dark:bg-d4 active:bg-l3 active:dark:bg-d3 focus-visible:bg-l4 focus-visible:dark:bg-d4 text-d2 dark:text-l2 ${isOpen && isSmallScreen ? "rounded-bl-none" : "rounded-bl-4xl"}`}
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
						transition={{ duration: 0.5, ease: easeInOut }}
						onClick={() => setIsOpen(false)}
						className="fixed top-0 left-0 z-80 w-full h-full backdrop-blur-[2px] bg-ld/50"
					/>
				)}
				<motion.aside
					key={`sidebar-${isMobile}`}
					initial={false}
					animate={{
						width: isOpen
							? (isMobile ? "min(calc(100vw - 4rem), 24rem)" : "24rem")
							: isMobile ? 0 : "4rem"
					}}
					exit={{ width: isMobile ? 0 : "4rem" }}
					transition={{ duration: 0.5, ease: easeInOut }}
					className={`flex flex-col w-auto h-full overflow-hidden bg-l2 dark:bg-d2 ${isMobile ? "fixed top-0 left-0 z-90" : "relative"}`}
				>
					<div className="flex flex-row justify-between items-center w-full h-16">
						<div className="overflow-hidden shrink-0 w-16 h-full"></div>
						{!isLoggedIn && (
							<Button
								aria-label="Account Button"
								className={`overflow-hidden flex flex-row gap-4 justify-start items-center w-auto h-full rounded-none transition-all duration-500 outline-none bg-blue text-l1 ${isOpen || isMobile ? "rounded-bl-4xl" : "rounded-bl-none"}`}
								onPress={openModal}
							>
								<CircleUserRound className="p-0.5 w-16 h-16 shrink-0" />
								<span className="text-lg font-black text-l1">ログイン</span>
							</Button>
						)}
					</div>
					<div className={`p-4 flex flex-col justify-start items-start flex-1 w-full h-full transition-all duration-500 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
						{!isLoggedIn && (
							<div className="overflow-hidden p-4 flex flex-col gap-4 w-88 h-auto rounded-2xl bg-l3 dark:bg-d3">
								<span className="select-text text-lg font-medium text-d3 dark:text-l3">ログインするとチャット履歴を保存できます。<br />ログイン後はここから最新のチャット履歴と作成したチャット履歴を利用できます。</span>
								<Button
									aria-label="Login Button"
									className="overflow-hidden flex flex-row gap-4 justify-center items-center w-auto h-12 rounded-4xl transition-all duration-500 outline-none bg-blue"
									onPress={openModal}
								>
									<span className="text-lg font-black text-l1">ログイン</span>
								</Button>
							</div>
						)}
					</div>
					<Button aria-label="Settings Button" className="overflow-hidden flex flex-row gap-4 justify-start items-center w-full h-16 rounded-none outline-none bg-transparent hover:bg-l4 hover:dark:bg-d4 active:bg-l3 active:dark:bg-d3 focus-visible:bg-l4 focus-visible:dark:bg-d4 text-d2 dark:text-l2">
						<Settings className="p-0.5 w-16 h-16 shrink-0" />
						<span className="text-lg font-medium text-d2 dark:text-l2">設定</span>
					</Button>
				</motion.aside>
			</AnimatePresence>
		</div >
	);
}
