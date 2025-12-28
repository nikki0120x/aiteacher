/* src\app\layout.tsx */
"use client";
import { HeroUIProvider } from "@heroui/react";
import { ToastProvider } from "@heroui/toast";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import NProgress from "nprogress";
import { Suspense, useEffect } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import Toolbar from "@/components/layout/toolbar";
import AuthModal from "@/features/auth/components/auth-modal";
import Server from "./server";
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
			<body style={{ fontFamily: "'Zen Maru Gothic', sans-serif" }} className="antialiased overflow-hidden">
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
						<div className="flex w-full h-dvh overflow-hidden">
							<div className="flex relative flex-row flex-1 md:pr-16 pb-12 md:pb-0 overflow-hidden">
								<Sidebar />
								<div className="flex flex-col flex-1 min-w-0">
									<Header />
									<main className="flex overflow-hidden flex-col size-full">
										<ToastProvider placement="top-left" />
										{children}
									</main>
								</div>
							</div>
							<Toolbar />
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
