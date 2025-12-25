/* src\components\layout\toolbar.tsx */
"use client";
import { Button } from "@heroui/react";
import { House, Send } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Toolbar() {
	const pathname = usePathname();
	const navItems = [
		{ href: "/home", label: "ホーム", icon: House },
		{ href: "/chat", label: "質問", icon: Send },
	];

	return (
		<aside className="box-content! flex fixed md:top-0 md:right-0 bottom-0 md:bottom-auto left-0 md:left-auto z-100 flex-row md:flex-col md:w-16 w-full h-12 md:h-full bg-l2 no-select dark:bg-d2">
			<div className="flex flex-row md:flex-col justify-center items-stretch size-full">
				{navItems.map((item) => {
					const isActive = pathname === item.href;

					return (
						<Button
							key={item.href}
							as={Link}
							href={item.href}
							isIconOnly
							aria-label={item.label}
							className={`
                                    flex flex-col flex-1 md:flex-none justify-center items-center w-12 md:w-16 h-12 md:h-16 rounded-none 
                                    ${
																			isActive
																				? "text-l1 bg-blue"
																				: "bg-l2 dark:bg-d2 hover:bg-l3 dark:hover:bg-d3"
																		}
                                `}
						>
							<item.icon size={20} />
							<span className="text-xs font-light">{item.label}</span>
						</Button>
					);
				})}
			</div>
		</aside>
	);
}
