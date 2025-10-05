"use client";

import React, { useEffect } from "react";

import { HeroUIProvider } from "@heroui/react";
import { usePathname, useSearchParams } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import NProgress from "nprogress";

import Server from "./server";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

import "./globals.css";

function TopProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.start();
    window.addEventListener("load", () => NProgress.done());
    return () => window.removeEventListener("load", () => NProgress.done());
  }, []);

  useEffect(() => {
    NProgress.start();
    NProgress.done();
  }, [pathname, searchParams?.toString()]);

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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <HeroUIProvider>
            {" "}
            <div className="flex flex-row w-dvw h-dvh">
              <Sidebar />
              <main className="flex flex-1 justify-center items-center w-full h-dvh flex-col overflow-x-hidden overflow-y-auto">
                <Header />
                <div className="flex flex-1 flex-col p-4 w-full max-w-3xl h-full">
                  {children}
                </div>
              </main>
            </div>
          </HeroUIProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
