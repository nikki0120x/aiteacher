"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, easeInOut } from "motion/react";
import { useChatStore } from "@/stores/useChat";
import { Button } from "@heroui/react";
import { Menu, SquarePen, CircleUserRound, Settings } from "lucide-react";

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

	// ---------- メニュー ---------- //

	const [isOpen, setIsOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 1024);
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
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
				className={`fixed top-0 left-0 z-100 w-16 h-16 rounded-none transition-all duration-500 outline-none bg-transparent hover:bg-l4 hover:dark:bg-d4 active:bg-l3 active:dark:bg-d3 focus-visible:bg-l4 focus-visible:dark:bg-d4 text-d2 dark:text-l2 ${isOpen ? "rounded-br-4xl" : " rounded-br-none"}`}
				onPress={() => setIsOpen(!isOpen)}
			>
				<Menu />
			</Button>
			<Button
				aria-label="New Chat Button"
				isIconOnly
				size="lg"
				radius="full"
				className="absolute top-0 right-0 z-100 w-16 h-16 rounded-none rounded-bl-4xl outline-none bg-transparent hover:bg-l4 hover:dark:bg-d4 active:bg-l3 active:dark:bg-d3 focus-visible:bg-l4 focus-visible:dark:bg-d4 text-d2 dark:text-l2"
				onPress={handleNewChat}
			>
				<SquarePen />
			</Button>

			<AnimatePresence>
				{(isOpen || !isMobile) && (
					<>
						{isMobile && isOpen && (
							<motion.div
								key="overlay"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.5, ease: easeInOut }}
								onClick={() => setIsOpen(false)}
								className="fixed top-0 left-0 z-80 w-full h-full backdrop-blur-[2px] bg-l1/50 dark:bg-d1/50"
							/>
						)}
						<motion.aside
							key="sidebar"
							initial={{ width: isMobile ? 0 : "4rem" }}
							animate={{ width: isOpen ? "24rem" : "4rem" }}
							exit={{ width: 0 }}
							transition={{ duration: 0.5, ease: easeInOut }}
							className={`
            flex flex-col w-auto h-full overflow-hidden bg-l2 dark:bg-d2
            ${isMobile ? "fixed top-0 left-0 z-90" : "relative"}
            `}
						>
							<div className="flex flex-row justify-between items-center w-full h-16">
								<div className="overflow-hidden shrink-0 w-16 h-full"></div>
								<Button aria-label="Account Button" className={`overflow-hidden flex flex-row gap-4 justify-start items-center w-auto h-full rounded-none transition-all duration-500 outline-none bg-l3 dark:bg-d3 hover:bg-l4 hover:dark:bg-d4 active:bg-l3 active:dark:bg-d3 focus-visible:bg-l4 focus-visible:dark:bg-d4 ${isOpen ? "rounded-bl-4xl" : "rounded-bl-none"}`}>
									<CircleUserRound className="p-0.5 w-16 h-16 shrink-0" />
									<span className="text-lg font-medium text-d2 dark:text-l2">ログイン</span>
								</Button>
							</div>
							<div className="flex flex-col justify-start items-start flex-1 w-full h-full"></div>
							<Button aria-label="Settings Button" className="overflow-hidden flex flex-row gap-4 justify-start items-center w-full h-16 rounded-none outline-none bg-transparent hover:bg-l4 hover:dark:bg-d4 active:bg-l3 active:dark:bg-d3 focus-visible:bg-l4 focus-visible:dark:bg-d4">
								<Settings className="p-0.5 w-16 h-16 shrink-0" />
								<span className="text-lg font-medium text-d2 dark:text-l2">設定</span>
							</Button>
						</motion.aside>
					</>
				)}
			</AnimatePresence>
		</div >
	);
}
