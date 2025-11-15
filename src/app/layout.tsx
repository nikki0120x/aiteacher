/* src\app\layout.tsx */

"use client";

import { useEffect, Suspense } from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { HeroUIProvider } from "@heroui/react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import NProgress from "nprogress";
import Server from "./server";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import "./globals.css";

function TopProgress() {
	const pathname = usePathname();

	useEffect(() => {
		NProgress.start();
		window.addEventListener("load", () => NProgress.done());
		return () => window.removeEventListener("load", () => NProgress.done());
	}, []);

	useEffect(() => {
		console.log("Route changed:", pathname);

		NProgress.start();
		NProgress.done();
	}, [pathname]);

	return null;
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ja" suppressHydrationWarning>
			<head>
				<Server />
			</head>
			<body style={{ fontFamily: "'Zen Maru Gothic', sans-serif" }}>
				<Suspense fallback={null}>
					<TopProgress />
				</Suspense>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<HeroUIProvider>
						<div className="flex flex-row w-dvw h-dvh">
							<Sidebar />
							<div className="flex flex-col w-full h-full">
								<Header />
								<main className="flex flex-col justify-center items-center w-full h-full overflow-hidden">
									<div className="flex flex-col p-4 w-full max-w-3xl h-full">
										{children}
									</div>
								</main>
							</div>
						</div>
					</HeroUIProvider>
				</ThemeProvider>
				<Analytics />
				<SpeedInsights />
			</body>
		</html>
	);
}
