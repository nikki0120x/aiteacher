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
import AuthModal from "@/features/auth/components/auth-modal";
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
						<div className="flex h-dvh w-dvw flex-row">
							<Sidebar />
							<div className="flex h-full w-full flex-col">
								<Header />
								<main className="flex h-full w-full flex-col items-center justify-center overflow-hidden">
									<div className="flex h-full w-full max-w-3xl flex-col p-4">
										{children}
									</div>
								</main>
							</div>
						</div>
						<AuthModal />
					</HeroUIProvider>
				</ThemeProvider>
				<Analytics />
				<SpeedInsights />
			</body>
		</html>
	);
}
