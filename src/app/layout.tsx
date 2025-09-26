import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AITeacher",
  description: "Support your Exploration for Wisdom with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Zen Maru Gothic', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
