/* src\components\layout\sidebar.tsx */
"use client";
import { Button } from "@heroui/react";
import { CircleUserRound, Menu, Settings, SquarePen } from "lucide-react";
import { AnimatePresence, easeOut, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/useAuth";
import { useChatStore } from "@/stores/useChat";

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

	const { openModal } = useAuthStore();

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
				className={`fixed top-0 left-0 z-100 w-16 h-16 text-d2 dark:text-l2 rounded-none outline-none transition-all duration-250 hover:bg-l4 focus-visible:bg-l4 active:bg-l3 hover:dark:bg-d4 focus-visible:dark:bg-d4 active:dark:bg-d3 ${
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
				className={`absolute top-0 right-0 z-100 w-16 h-16 text-d2 dark:text-l2 rounded-none outline-none transition-all duration-250 bg-l1 hover:bg-l4 focus-visible:bg-l4 active:bg-l3 dark:bg-d1 hover:dark:bg-d4 focus-visible:dark:bg-d4 active:dark:bg-d3 ${
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
						className="fixed top-0 left-0 z-80 w-full h-full backdrop-blur-[2px] bg-ld/50"
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
					className="flex overflow-hidden max-md:fixed md:relative max-md:top-0 max-md:left-0 max-md:z-90 flex-col w-auto h-full bg-l2 dark:bg-d2"
				>
					<div className="flex flex-row justify-between items-center w-full h-16">
						<div className="overflow-hidden shrink-0 w-16 h-full"></div>
						<Button
							aria-label="Account Button"
							className={`flex overflow-hidden flex-row gap-4 justify-start items-center w-auto h-full text-l1 rounded-none outline-none transition-all duration-250 bg-blue ${isOpen || isMobile ? "rounded-bl-4xl" : "rounded-bl-none"}`}
							onPress={openModal}
						>
							<CircleUserRound className="shrink-0 p-0.5 w-16 h-16" />
							<span className="text-lg font-black text-l1">ログイン</span>
						</Button>
					</div>
					<div
						className={`flex flex-col flex-1 justify-start items-start p-4 w-full h-full transition-all duration-250 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
					>
						<div className="flex overflow-hidden flex-col gap-4 p-4 w-88 h-auto rounded-2xl bg-l3 dark:bg-d3">
							<span className="text-lg font-medium text-d3 dark:text-l3 select-text">
								ログインするとチャット履歴を保存できます。
								<br />
								ログイン後はここから最新のチャット履歴と作成したチャット履歴を利用できます。
							</span>
							<Button
								aria-label="Login Button"
								className="flex overflow-hidden flex-row gap-4 justify-center items-center w-auto h-12 rounded-4xl outline-none transition-all duration-250 bg-blue"
								onPress={openModal}
							>
								<span className="text-lg font-black text-l1">ログイン</span>
							</Button>
						</div>
					</div>
					<Button
						aria-label="Settings Button"
						className="flex overflow-hidden flex-row gap-4 justify-start items-center w-full h-16 text-d2 dark:text-l2 bg-transparent rounded-none outline-none hover:bg-l4 focus-visible:bg-l4 active:bg-l3 hover:dark:bg-d4 focus-visible:dark:bg-d4 active:dark:bg-d3"
					>
						<Settings className="shrink-0 p-0.5 w-16 h-16" />
						<span className="text-lg font-medium text-d2 dark:text-l2">
							設定
						</span>
					</Button>
				</motion.aside>
			</AnimatePresence>
		</div>
	);
}
