import { Head, Html, Main, NextScript } from "next/document"

export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#2A2A2A" />

        <script src="https://yandex.ru/ads/system/context.js" async></script>
      </Head>
      <body className="bg-gray-900">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
