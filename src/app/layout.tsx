/* src\app\layout.tsx */
"use client";
import { HeroUIProvider } from "@heroui/react";
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
						<div className="flex md:flex-row flex-col w-dvw h-dvh">
							<div className="flex relative flex-row flex-1">
								<Sidebar />
								<div className="flex flex-col size-full">
									<Header />
									<main className="size-full">{children}</main>
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
