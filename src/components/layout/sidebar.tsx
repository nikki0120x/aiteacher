/* src\components\layout\sidebar.tsx */
"use client";
import { Button } from "@heroui/react";
import { CircleUserRound, Menu } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/useAuth";

export default function Sidebar() {
	const { openModal } = useAuthStore();

	// ================================================================
	//     メニュー
	// ================================================================

	const [isOpen, setIsOpen] = useState(false);

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

	// ================================================================
	//     フロントエンド
	// ================================================================

	return (
		<div className="no-select">
			<Button
				aria-label="Menu Button"
				isIconOnly
				size="lg"
				radius="full"
				onPress={() => setIsOpen(!isOpen)}
				className={`fixed inset-0 z-30 size-16 text-d1 dark:text-l1 bg-transparent rounded-none outline-none transition-all duration-250 hover:bg-l2 dark:hover:bg-d2 ${
					isOpen ? "rounded-br-4xl" : "lg:rounded-none"
				}`}
			>
				<Menu />
			</Button>
			<AnimatePresence>
				<motion.div
					key="overlay"
					initial={false}
					animate={{
						opacity: isOpen ? 1 : 0,
						pointerEvents: isOpen ? "auto" : "none",
					}}
					transition={{ duration: 0.25, ease: "easeInOut" }}
					onClick={() => setIsOpen(false)}
					className="lg:hidden absolute inset-0 z-20 size-full backdrop-blur-lg cursor-pointer bg-l5/50 dark:bg-d5/50"
				/>
				<motion.aside
					key="sidebar"
					initial={false}
					animate={{
						width: isOpen ? "var(--w-open)" : "var(--w-closed)",
					}}
					exit={{ width: "var(--w-closed)" }}
					transition={{ duration: 0.25, ease: "easeInOut" }}
					className={`
						box-content! flex overflow-hidden max-lg:absolute lg:relative max-lg:inset-0 max-lg:z-20 flex-col h-full border-l5 lg:border-r-1 dark:border-d5 bg-l1 [--w-closed:0px] [--w-open:min(calc(100%-4rem),24rem)] dark:bg-d1 lg:[--w-closed:4rem] lg:[--w-open:24rem] ${
							isOpen ? "border-r-1" : "border-r-0"
						}`}
				>
					<div className="flex flex-row justify-between items-center w-full h-16">
						<div className="overflow-hidden shrink-0 w-16 h-full"></div>
						<Button
							aria-label="Account Button"
							className={`flex overflow-hidden flex-row gap-4 justify-start items-center h-full text-l1 rounded-none outline-none transition-all duration-250 bg-blue ${isOpen ? "rounded-bl-4xl" : "rounded-bl-4xl lg:rounded-bl-none"}`}
							onPress={openModal}
						>
							<CircleUserRound className="shrink-0 p-0.5 w-16 h-16" />
							<span className="text-lg font-black text-l1">ログイン</span>
						</Button>
					</div>
					<div
						className={`flex flex-col flex-1 justify-start items-start p-4 size-full transition-all duration-250 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
					>
						<div className="flex overflow-hidden flex-col gap-4 p-4 w-88 h-auto rounded-lg bg-l2 dark:bg-d2">
							<span className="text-lg font-medium text-d2 dark:text-l2 select-text">
								ログインするとチャット履歴を保存できます。
								<br />
								ログイン後はここから最新のチャット履歴と作成したチャット履歴を利用できます。
							</span>
							<Button
								aria-label="Login Button"
								className="flex overflow-hidden flex-row gap-4 justify-center items-center h-12 rounded-4xl outline-none transition-all duration-250 bg-blue"
								onPress={openModal}
							>
								<span className="text-lg font-black text-l1">ログイン</span>
							</Button>
						</div>
					</div>
				</motion.aside>
			</AnimatePresence>
		</div>
	);
}
