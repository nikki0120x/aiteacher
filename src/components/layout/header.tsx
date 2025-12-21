/* src\components\layout\header.tsx */
"use client";
import {
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	Progress,
} from "@heroui/react";
import { ChevronDown, SquarePen } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { aiModels, useChatSettings } from "@/hooks/useChatSettings";
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
	//     AI 選択
	// ================================================================

	const { aiModel, selectedModelLabel, handleAIModelSelection } =
		useChatSettings();

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
		<header className="flex flex-row justify-between items-center w-full h-16 bg-transparent backdrop-blur-xs">
			{loading && (
				<Progress
					isIndeterminate
					size="sm"
					color="primary"
					aria-label="Page loading indicator"
					className="absolute -bottom-2 left-0 w-full"
				/>
			)}
			<Dropdown
				placement="bottom"
				classNames={{
					content:
						"shadow-lg shadow-l3 dark:shadow-d3 bg-l3 dark:bg-d3 text-d3 dark:text-l3",
				}}
			>
				<DropdownTrigger>
					<Button
						aria-label="Select a AI Option Button"
						radius="full"
						className="text-base font-medium text-d3 dark:text-l3 bg-transparent border-1 border-l3 dark:border-d3 shadow-lg shadow-l3 hover:bg-l3 dark:shadow-d3 hover:dark:bg-d3"
					>
						{selectedModelLabel}
						<ChevronDown size={16} />
					</Button>
				</DropdownTrigger>
				<DropdownMenu
					disallowEmptySelection
					aria-label="AI Options Menu"
					selectedKeys={[aiModel]}
					selectionMode="single"
					onSelectionChange={handleAIModelSelection}
					itemClasses={{
						base: [],
					}}
				>
					<DropdownItem
						key="gemini-2.5-flash"
						description={aiModels["gemini-2.5-flash"].description}
					>
						{aiModels["gemini-2.5-flash"].label}
					</DropdownItem>
					<DropdownItem
						key="gemini-2.5-flash-lite"
						description={aiModels["gemini-2.5-flash-lite"].description}
					>
						{aiModels["gemini-2.5-flash-lite"].label}
					</DropdownItem>
				</DropdownMenu>
			</Dropdown>
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
