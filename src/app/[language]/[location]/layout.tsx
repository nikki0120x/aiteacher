"use client";
import { notFound, usePathname } from "next/navigation";
import React from "react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { LOCATIONS } from "@/i18n/routing";

interface RegionLayoutProps {
	children: React.ReactNode;
	params: Promise<{ location: string }>;
	modal: React.ReactNode;
}

export default function RegionLayout({
	children,
	params,
	modal,
}: RegionLayoutProps) {
	const { location } = React.use(params);
	const pathname = usePathname();
	const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

	if (!(LOCATIONS as string[]).includes(location)) {
		notFound();
	}

	const isAuthPage = pathname.includes("/auth");

	if (isAuthPage) {
		return (
			<GoogleReCaptchaProvider
				reCaptchaKey={siteKey}
				scriptProps={{
					async: true,
					defer: true,
					appendTo: "head",
				}}
			>
				{children}
				{modal}
			</GoogleReCaptchaProvider>
		);
	}

	return (
		<>
			{children}
			{modal}
		</>
	);
}
