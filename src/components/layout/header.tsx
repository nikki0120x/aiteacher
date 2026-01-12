/* src\components\layout\header.tsx */
"use client";
import { Progress } from "@heroui/react";
import { Bell, Languages, Menu, SunMoon, UserRound } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { useToolbarStore } from "@/stores/useToolbar";

export default function Header() {
	const { toggleToolbar } = useToolbarStore();
	const router = useRouter();

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
	//     レンダリング
	// ================================================================

	return (
		<header className="box-content! flex relative flex-row justify-between items-center w-full h-16 border-l5 dark:border-d5 border-b bg-l1 no-select dark:bg-d1">
			{loading && (
				<Progress
					isIndeterminate
					size="sm"
					color="primary"
					aria-label="Page loading indicator"
					className="absolute -bottom-1 left-0 z-10 w-full"
				/>
			)}

			<div className="flex flex-row justify-start items-center size-full">
				<Button
					aria-label="Menu Button"
					onClick={toggleToolbar}
					className="flex justify-center items-center m-2 size-12 rounded-2xl bg-l1 hover:bg-l2 dark:bg-d1 dark:hover:bg-d2"
				>
					<Menu className="size-6 text-d1 dark:text-l1" />
				</Button>
				<Button
					aria-label="Home Button"
					onClick={() => router.push("/")}
					className="flex justify-center items-center p-2 h-12 rounded-2xl bg-l1 dark:bg-d1"
				>
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
			</div>

			<div className="flex flex-row justify-end items-center size-full">
				<div className="flex flex-row gap-1 justify-center items-center">
					<Button
						aria-label="Notification Button"
						className="flex justify-center items-center size-12 rounded-2xl bg-l1 hover:bg-l2 dark:bg-d1 dark:hover:bg-d2"
					>
						<Bell className="size-6 text-d1 dark:text-l1" />
					</Button>
					<Button
						aria-label="Theme Button"
						className="flex justify-center items-center size-12 rounded-2xl bg-l1 hover:bg-l2 dark:bg-d1 dark:hover:bg-d2"
					>
						<SunMoon className="size-6 text-d1 dark:text-l1" />
					</Button>
					<Button
						aria-label="Language Button"
						className="flex justify-center items-center size-12 rounded-2xl bg-l1 hover:bg-l2 dark:bg-d1 dark:hover:bg-d2"
					>
						<Languages className="size-6 text-d1 dark:text-l1" />
					</Button>
				</div>
				<Button
					aria-label="Account Button"
					className="flex justify-center items-center m-2 size-12 rounded-full bg-blue"
				>
					<UserRound className="size-6 text-l1" />
				</Button>
			</div>
		</header>
	);
}
