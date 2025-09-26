import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "AITeacher — ホーム",
  description: "AIと共に学び逢おう！",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-P7BN0KQ1YQ"
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-P7BN0KQ1YQ');
            `,
          }}
        />
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
