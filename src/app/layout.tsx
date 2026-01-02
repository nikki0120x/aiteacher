/* src\app\layout.tsx */
import type { Metadata, Viewport } from "next";
import Client from "./client";
import Server from "./server";
import "./globals.css";

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
			<body
				style={{ fontFamily: "'Zen Maru Gothic', sans-serif" }}
				className="overflow-hidden antialiased"
			>
				<Client>{children}</Client>
			</body>
		</html>
	);
}
