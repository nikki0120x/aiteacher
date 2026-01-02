/* src\components\layout\header.tsx */
"use client";
import { Button, Progress } from "@heroui/react";
import { SquarePen } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useChatStore } from "@/stores/useChat";

export default function Header() {
	const router = useRouter();

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
		<header className="box-content! flex relative flex-row justify-between items-center w-full h-16 border-b-1 border-l5 dark:border-d5 bg-l1 no-select dark:bg-d1">
			{loading && (
				<Progress
					isIndeterminate
					size="sm"
					color="primary"
					aria-label="Page loading indicator"
					className="absolute -bottom-1 left-0 z-10 w-full"
				/>
			)}
			<Button
				onPress={() => router.push("/")}
				className="flex flex-row justify-center items-center ml-16 lg:ml-0 h-full bg-transparent rounded-none hover:bg-l2 dark:hover:bg-d2"
			>
				<Image
					src="/images/icons/webp/Icon_AITeacher_small_theme.webp"
					alt="The AITeacher Icon"
					width={40}
					height={40}
					className="object-contain w-7.5 lg:w-10"
				/>
				<Image
					src="/images/logos/webp/Logo_AITeacher_small_dark.webp"
					alt="The AITeacher Logo"
					width={160}
					height={40}
					className="block dark:hidden object-contain w-30 lg:w-40"
				/>
				<Image
					src="/images/logos/webp/Logo_AITeacher_small_light.webp"
					alt="The AITeacher Logo"
					width={160}
					height={40}
					className="dark:block hidden object-contain w-30 lg:w-40"
				/>
			</Button>
			<Button
				aria-label="New Chat Button"
				isIconOnly
				size="lg"
				radius="full"
				onPress={handleNewChat}
				className="size-16 text-d1 dark:text-l1 rounded-none outline-none transition-all duration-250 bg-l1 hover:bg-l3 focus-visible:bg-l3 active:bg-l2 dark:bg-d1 hover:dark:bg-d3 focus-visible:dark:bg-d3 active:dark:bg-d2"
			>
				<SquarePen />
			</Button>
		</header>
	);
}
