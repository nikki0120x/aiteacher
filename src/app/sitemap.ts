/* src\app\sitemap.ts */
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = (
		process.env.NEXT_PUBLIC_BASE_URL || "https://www.focalrina.com"
	).replace(/\/$/, "");
	const isProduction = process.env.VERCEL_ENV === "production";

	if (!isProduction) {
		return [];
	}

	return [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 1,
		},
		{
			url: `${baseUrl}/dashboard/`,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 0.75,
		},
		{
			url: `${baseUrl}/chat/`,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 0.75,
		},
		{
			url: `${baseUrl}/create/`,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 0.75,
		},
		{
			url: `${baseUrl}/analysis/`,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 0.75,
		},
		{
			url: `${baseUrl}/timeline/`,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 0.75,
		},
	];
}
