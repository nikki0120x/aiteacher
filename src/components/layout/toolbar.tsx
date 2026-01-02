/* src\components\layout\toolbar.tsx */
"use client";
import { Button } from "@heroui/react";
import { LayoutDashboard, MessageCircleMore } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface NavItem {
	href: string;
	label: ReactNode;
	text: string;
	icon: typeof LayoutDashboard;
}

export default function Toolbar() {
	const pathname = usePathname();
	const navItems: NavItem[] = [
		{
			href: "/dashboard/",
			label: (
				<>
					ダッシュ
					<wbr />
					ボード
				</>
			),
			text: "ダッシュボード",
			icon: LayoutDashboard,
		},
		{
			href: "/chat/",
			label: "質問",
			text: "質問",
			icon: MessageCircleMore,
		},
	];

	return (
		<aside className="box-content! flex fixed lg:top-0 lg:right-0 bottom-0 lg:bottom-auto left-0 lg:left-auto z-100 flex-row lg:flex-col pb-[env(safe-area-inset-bottom)] lg:pb-0 lg:w-16 w-full h-16 lg:h-full border-l5 border-t-1 lg:border-l-1 lg:border-t-0 dark:border-d5 bg-l1 no-select dark:bg-d1">
			<div className="flex flex-row lg:flex-col justify-center items-stretch size-full">
				{navItems.map((item) => {
					const isActive = pathname === item.href;

					return (
						<Button
							key={item.href}
							as={Link}
							href={item.href}
							aria-label={item.text}
							isIconOnly
							className={`flex flex-col flex-1 lg:flex-none justify-center items-center p-0! size-16 rounded-none 
                                    ${
																			isActive
																				? "text-l1 bg-blue"
																				: "bg-transparent hover:bg-l2 dark:hover:bg-d2"
																		}
                                `}
						>
							<item.icon size={24} />
							<span className="mt-1 text-xs font-medium text-d1 dark:text-l1 text-center break-keep wrap-break-word">
								{item.label}
							</span>
						</Button>
					);
				})}
			</div>
		</aside>
	);
}
