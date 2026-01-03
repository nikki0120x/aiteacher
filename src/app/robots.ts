/* src\app\robots.ts */
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	const isProduction = process.env.VERCEL_ENV === "production";
	const baseUrl = (
		process.env.NEXT_PUBLIC_BASE_URL || "https://www.focalrina.com"
	).replace(/\/$/, "");

	return {
		rules: {
			userAgent: "*",
			allow: isProduction ? "/" : undefined,
			disallow: isProduction ? "/api/" : "/",
		},
		sitemap: isProduction ? `${baseUrl}/sitemap.xml` : undefined,
	};
}
