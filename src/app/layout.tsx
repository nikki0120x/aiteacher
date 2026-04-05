import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Client from "@/app/client";
import Server from "@/app/server";
import "@/app/globals.css";
import { Providers } from "@/app/provider";

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	viewportFit: "cover",
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#f2f2f2" },
		{ media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
	],
};

export const metadata: Metadata = {
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "AITeacher",
	},
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const locale = await getLocale();
	const messages = await getMessages();

	return (
		<html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
			<head>
				<Server />
			</head>
			<body
				style={{
					fontFamily: "'Zen Maru Gothic', sans-serif",
					fontSize: "16px",
					lineHeight: "calc(1.5 / 1)",
					fontWeight: "500",
				}}
				className="overflow-hidden bg-l1 text-d1 dark:bg-d1 dark:text-l1"
			>
				<NextIntlClientProvider messages={messages}>
					<Providers>
						<Client>{children}</Client>
					</Providers>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
