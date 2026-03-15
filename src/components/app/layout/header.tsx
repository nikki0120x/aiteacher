"use client";
import { Bell, Globe, Languages, Menu, SunMoon, UserRound, SquarePen } from "lucide-react";
import Image from "next/image";
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

				<Button
					onClick={() => actions.router.push("/")}
					className="colors max-lg:hidden lg:flex h-10 w-35 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
				>
					<Image
						src="/images/logos/webp/Logo_AITeacher_small_theme.webp"
						alt="The AITeacher Logo"
						width={160}
						height={40}
						priority
						className="w-30 transform object-contain"
					/>
				</Button>

				{isChatPage && (
					<>
						<div className="h-6 w-px bg-l5 dark:bg-d5 colors" />

						<Button
							onClick={actions.triggerChatReset}
							className="colors flex size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
						>
							<SquarePen className="all text-blue" />
						</Button>
					</>
				)}
			</div>

			<div className="flex size-full flex-row items-center justify-end gap-1">
				<Button
					onClick={() => actions.handleMenuToggle("notifications")}
					className={`flex size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2 colors ${states.activeMenu === "notifications" && "bg-l5! dark:bg-d5!"}`}
				>
					<Bell className="all text-d1 dark:text-l1" />
				</Button>

				<Button
					onClick={() => actions.handleMenuToggle("theme")}
					className={`hidden size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 lg:flex dark:focus-visible:bg-d2 dark:hover:bg-d2 colors ${states.activeMenu === "theme" && "bg-l5! dark:bg-d5!"}`}
				>
					<SunMoon className="all text-d1 dark:text-l1" />
				</Button>

				<Button
					onClick={() => actions.handleMenuToggle("language")}
					className={`hidden size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 lg:flex dark:focus-visible:bg-d2 dark:hover:bg-d2 colors ${states.activeMenu === "language" && "bg-l5! dark:bg-d5!"}`}
				>
					<Languages className="all text-d1 dark:text-l1" />
				</Button>

				<Button
					onClick={() => actions.handleMenuToggle("location")}
					className={`hidden size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 lg:flex dark:focus-visible:bg-d2 dark:hover:bg-d2 colors ${states.activeMenu === "location" && "bg-l5! dark:bg-d5!"}`}
				>
					<Globe className="all text-d1 dark:text-l1" />
				</Button>

				<Button
					onClick={() => actions.handleMenuToggle("settings")}
					className="colors flex size-10 items-center justify-center rounded-full bg-blue"
				>
					<UserRound className="all text-d1 dark:text-l1" />
				</Button>
			</div>
		</header>
	);
}
