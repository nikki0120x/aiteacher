"use client";
import {
	Bell,
	Globe,
	Languages,
	Menu,
	SquarePen,
	SunMoon,
	TextAlignStart,
	UserRound,
} from "lucide-react";
import { useAppView } from "@/app/[language]/[location]/views/viewApp";
import { Button } from "@/components/ui";
import { usePathname } from "@/i18n/routing";

export default function Header() {
	const { states, actions } = useAppView();
	const pathname = usePathname();
	const isChatPage = pathname.includes("/chat");

	return (
		<header className="colors relative z-10000 flex h-15 w-full flex-none select-none flex-row items-center justify-between border-l5 border-b bg-l1 p-2 dark:border-d5 dark:bg-d dark:bg-d1">
			<div className="flex size-full flex-row items-center justify-start gap-2">
				<Button
					onClick={actions.setSidebarOpen}
					className="colors flex size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
				>
					<Menu className="all text-d1 dark:text-l1" />
				</Button>

				{isChatPage && (
					<div className="flex flex-row gap-2 justify-start items-center">
						<div className="h-8 w-px bg-l5 dark:bg-d5 colors" />

						<Button className="colors flex size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2">
							<TextAlignStart className="all text-blue" />
						</Button>
					</div>
				)}
			</div>

			<div className="flex size-full flex-row items-center justify-end gap-2">
				{isChatPage && (
					<div className="flex flex-row gap-2 justify-end items-center">
						<Button
							onClick={actions.triggerChatReset}
							className="colors flex size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
						>
							<SquarePen className="all text-blue" />
						</Button>

						<div className="h-6 w-px bg-l5 dark:bg-d5 colors" />
					</div>
				)}

				<Button
					onClick={() => actions.handleMenuToggle("notifications")}
					className={`max-lg:hidden lg:flex size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2 colors ${states.activeMenu === "notifications" && "bg-l5! dark:bg-d5!"}`}
				>
					<Bell className="all text-d1 dark:text-l1" />
				</Button>

				<Button
					onClick={() => actions.handleMenuToggle("theme")}
					className={`max-lg:hidden size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 lg:flex dark:focus-visible:bg-d2 dark:hover:bg-d2 colors ${states.activeMenu === "theme" && "bg-l5! dark:bg-d5!"}`}
				>
					<SunMoon className="all text-d1 dark:text-l1" />
				</Button>

				<Button
					onClick={() => actions.handleMenuToggle("language")}
					className={`max-lg:hidden size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 lg:flex dark:focus-visible:bg-d2 dark:hover:bg-d2 colors ${states.activeMenu === "language" && "bg-l5! dark:bg-d5!"}`}
				>
					<Languages className="all text-d1 dark:text-l1" />
				</Button>

				<Button
					onClick={() => actions.handleMenuToggle("location")}
					className={`max-lg:hidden size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 lg:flex dark:focus-visible:bg-d2 dark:hover:bg-d2 colors ${states.activeMenu === "location" && "bg-l5! dark:bg-d5!"}`}
				>
					<Globe className="all text-d1 dark:text-l1" />
				</Button>

				<Button
					onClick={() => actions.handleMenuToggle("settings")}
					className="colors flex size-10 items-center justify-center rounded-full bg-blue"
				>
					<UserRound className="all text-l1" />
				</Button>
			</div>
		</header>
	);
}
