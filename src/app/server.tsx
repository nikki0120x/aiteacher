import Script from "next/script";

export default function Server() {
	const schemaMarkup = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: "AITeacher",
		url: "https://www.aiteacher.focalrina.com/",
		alternateName: "aiteacher",
	};

	return (
		<>
			<title>AITeacher</title>
			<Script
				id="ld-json"
				type="application/ld+json"
				strategy="afterInteractive"
			>
				{JSON.stringify(schemaMarkup)}
			</Script>
			<meta name="description" content="勉強に、浪漫と好奇心を。" />
			<meta charSet="UTF-8" />
			<meta property="og:site_name" content="AITeacher" />
			<meta property="og:title" content="AITeacher" />
			<meta property="og:url" content="https://www.aiteacher.focalrina.com/" />
			<meta property="og:type" content="website" />
			<meta property="og:description" content="勉強に、浪漫と好奇心を。" />
			<Script
				src="https://www.googletagmanager.com/gtag/js?id=G-P7BN0KQ1YQ"
				strategy="afterInteractive"
			/>
			<Script id="google-analytics" strategy="afterInteractive">
				{`
					window.dataLayer = window.dataLayer || [];
					function gtag(){dataLayer.push(arguments);}
					gtag('js', new Date());
					gtag('config', 'G-P7BN0KQ1YQ');
				`}
			</Script>
			<link rel="preconnect" href="https://fonts.googleapis.com" />
			<link
				rel="preconnect"
				href="https://fonts.gstatic.com"
				crossOrigin="anonymous"
			/>
			<link
				href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@300;400;500;700;900&display=swap"
				rel="stylesheet"
			/>
		</>
	);
}
