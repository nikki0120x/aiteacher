// src/app/server.tsx
export default function Server() {
  return (
    <>
      <title>AITeacher — FoCalrina</title>
      <meta name="description" content="AIと共に学び逢おう！" />
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      <script
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-P7BN0KQ1YQ"
      ></script>
      <script
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
