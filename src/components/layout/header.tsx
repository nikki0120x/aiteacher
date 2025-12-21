/* src\components\layout\header.tsx */
"use client";
import { Button, Progress } from "@heroui/react";
import { SquarePen } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useChatStore } from "@/stores/useChat";

export default function Header() {
	const {
		abortController,
		setIsSent,
		setIsLoading,
		setActiveContent,
		clearMessage,
		setAbortController,
	} = useChatStore();

	// ================================================================
	//     ローディング
	// ================================================================

	const [loading, setLoading] = useState(false);
	const pathname = usePathname();

	useEffect(() => {
		setLoading(true);

		console.log("Navigation detected, resetting loading state:", pathname);

		const timeout = setTimeout(() => {
			setLoading(false);
		}, 500);

		return () => clearTimeout(timeout);
	}, [pathname]);

	// ================================================================
	//     新規チャット
	// ================================================================

	const handleNewChat = () => {
		setIsSent(false);
		setIsLoading(false);
		setActiveContent("sliders");
		clearMessage();
		if (abortController) {
			abortController.abort();
			setAbortController(null);
		}
	};

	// ================================================================
	//     フロントエンド
	// ================================================================

	return (
		<header className="flex flex-row justify-end items-center w-full h-16 bg-transparent backdrop-blur-xs">
			{loading && (
				<Progress
					isIndeterminate
					size="sm"
					color="primary"
					aria-label="Page loading indicator"
					className="absolute -bottom-2 left-0 w-full"
				/>
			)}
			<Button
				aria-label="New Chat Button"
				isIconOnly
				size="lg"
				radius="full"
				onPress={handleNewChat}
				className="size-16 text-d1 dark:text-l1 rounded-none rounded-bl-4xl outline-none transition-all duration-250 bg-l1 hover:bg-l3 focus-visible:bg-l3 active:bg-l2 dark:bg-d1 hover:dark:bg-d3 focus-visible:dark:bg-d3 active:dark:bg-d2"
			>
				<SquarePen />
			</Button>
		</header>
	);
}
