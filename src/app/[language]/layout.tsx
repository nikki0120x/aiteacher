import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

export default async function LocaleLayout({
	children,
	params,
}: Readonly<{
	children: React.ReactNode;
	params: Promise<{ language: string }>;
}>) {
	const { language } = await params;

	if (!hasLocale(routing.locales, language)) {
		notFound();
	}

	setRequestLocale(language);

	return <>{children}</>;
}
