/* src\components\layout\header.tsx */
"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Progress, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import { ChevronDown } from "lucide-react";
import { useChatSettings, aiModels } from "@/hooks/useChatSettings";

export default function Header() {
	const {
		aiModel,
		selectedModelLabel,
		handleAIModelSelection,
	} = useChatSettings();

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
		<header className="flex flex-row justify-center items-center z-70 w-full h-16 backdrop-blur-xs bg-transparent">
			{loading && (
				<Progress
					isIndeterminate
					size="sm"
					color="primary"
					aria-label="Page loading indicator"
					className="absolute left-0 bottom-0 w-full"
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
						className="shadow-lg shadow-l3 dark:shadow-d3 bg-transparent border-1 border-l3 dark:border-d3 text-base font-medium text-d3 dark:text-l3 hover:bg-l3 hover:dark:bg-d3"
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
						key="gemini-3-pro-preview"
						description={aiModels["gemini-3-pro-preview"].description}
					>
						{aiModels["gemini-3-pro-preview"].label}
					</DropdownItem>
					<DropdownItem
						key="gemini-2.5-pro"
						description={aiModels["gemini-2.5-pro"].description}
					>
						{aiModels["gemini-2.5-pro"].label}
					</DropdownItem>
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
