export default function Server() {
	const schemaMarkup = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: "AITeacher",
		url: "https://www.focalrina.com/",
		alternateName: "aiteacher",
	};

	return (
		<>
			<title>AITeacher</title>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LDは静的で制御されたデータであるため
				dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
			/>
			<meta name="description" content="AIと共に学び逢おう！" />
			<meta charSet="UTF-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<meta property="og:site_name" content="AITeacher" />
			<meta property="og:title" content="AITeacher" />
			<meta property="og:url" content="https://www.focalrina.com/" />
			<meta property="og:type" content="website" />
			<meta property="og:description" content="AIと共に学び逢おう！" />
			<script
				async
				src="https://www.googletagmanager.com/gtag/js?id=G-P7BN0KQ1YQ"
			></script>
			<script
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Google Analyticsの静的な初期化コードであるため
				dangerouslySetInnerHTML={{
					__html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-P7BN0KQ1YQ');
          `,
				}}
			/>
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
