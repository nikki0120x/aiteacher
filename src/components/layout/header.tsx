"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Progress } from "@heroui/react";

export default function Header() {
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
		<header className="flex flex-row items-center z-70 w-full h-16 backdrop-blur-xs bg-transparent">
			{loading && (
				<Progress
					isIndeterminate
					size="sm"
					color="primary"
					aria-label="Page loading indicator"
					className="absolute left-0 bottom-0 w-full"
				/>
			)}
		</header>
	);
}
