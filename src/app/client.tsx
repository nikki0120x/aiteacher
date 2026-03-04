"use client";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import NProgress from "nprogress";
import { Suspense, useEffect } from "react";
import Header from "@/components/app/layout/header";
import Sidebar from "@/components/app/layout/sidebar";

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
	useEffect(() => {
		const handleContextMenu = (e: MouseEvent) => {
			e.preventDefault();
		};

		document.addEventListener("contextmenu", handleContextMenu);
		return () => {
			document.removeEventListener("contextmenu", handleContextMenu);
		};
	}, []);

	return (
		<>
			<Suspense fallback={null}>
				<TopProgress />
			</Suspense>
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
				<div className="relative flex h-dvh w-dvw overflow-hidden">
					<div
						className="all relative flex flex-1 flex-col overflow-hidden"
						style={{
							paddingBottom: "env(safe-area-inset-bottom)",
						}}
					>
						<Header />
						<div className="relative flex min-w-0 flex-1 flex-row">
							<Sidebar />
							<main className="relative flex size-full flex-col overflow-hidden">
								{children}
							</main>
						</div>
					</div>
				</div>
			</ThemeProvider>
			<Analytics />
			<SpeedInsights />
		</>
	);
}
