/* src\components\layout\header.tsx */
"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
	Progress,
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	Button,
} from "@heroui/react";
import { ChevronDown } from "lucide-react";
import { useChatSettings, aiModels } from "@/hooks/useChatSettings";

export default function Header() {
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

	return (
		<header className="z-70 flex h-16 w-full flex-row items-center justify-center bg-transparent backdrop-blur-xs">
			{loading && (
				<Progress
					isIndeterminate
					size="sm"
					color="primary"
					aria-label="Page loading indicator"
					className="absolute bottom-0 left-0 w-full"
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
						className="border-1 border-l3 bg-transparent font-medium text-base text-d3 shadow-l3 shadow-lg hover:bg-l3 dark:border-d3 dark:text-l3 dark:shadow-d3 hover:dark:bg-d3"
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
		</header>
	);
}
