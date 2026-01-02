/* src\app\client.tsx */
"use client";
import { HeroUIProvider } from "@heroui/react";
import { ToastProvider } from "@heroui/toast";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import NProgress from "nprogress";
import { Suspense, useEffect, useState } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import Toolbar from "@/components/layout/toolbar";
import AuthModal from "@/features/auth/components/auth-modal";

function LoadingOverlay() {
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => setIsLoading(false));
		return () => clearTimeout(timer);
	}, []);

	return (
		<AnimatePresence>
			{isLoading && (
				<motion.div
					key="loading-overlay"
					initial={{ opacity: 1 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.25, ease: "easeInOut" }}
					className="fixed inset-0 z-1000 w-dvw h-dvh cursor-wait bg-l1 dark:bg-d1"
				/>
			)}
		</AnimatePresence>
	);
}

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

export default function Client({ children }: { children: React.ReactNode }) {
	return (
		<>
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
					<LoadingOverlay />
					<div className="flex overflow-hidden w-full h-dvh">
						<div
							className="flex overflow-hidden relative flex-row flex-1 lg:pr-16 lg:pb-0"
							style={{
								paddingBottom: "calc(4rem + env(safe-area-inset-bottom))",
							}}
						>
							<Sidebar />
							<div className="flex flex-col flex-1 min-w-0">
								<Header />
								<main className="flex overflow-hidden flex-col size-full">
									<ToastProvider placement="top-center" />
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
		</>
	);
}
