import { notFound } from "next/navigation";
import { LOCATIONS } from "@/i18n/routing";

export default async function RegionLayout({
	children,
	params,
	modal,
}: Readonly<{
	children: React.ReactNode;
	params: Promise<{ location: string }>;
	modal: React.ReactNode;
}>) {
	const { location } = await params;

	if (!(LOCATIONS as string[]).includes(location)) {
		notFound();
	}

	return (
		<>
			{children}
			{modal}
		</>
	);
}
