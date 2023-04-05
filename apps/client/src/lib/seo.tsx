import { env } from "./env/client.mjs"

const title = "500 ЗЛОБНЫХ Карт Онлайн"
const description =
  "Онлайн версия игры «500 злобных карт»! Сыграй в эту весёлую игру бесплатно"

function getMetaTags(route: string /* router.asPath */) {
  const path = route.split("?")[0]

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta
        property="og:url"
        content={`${env.NEXT_PUBLIC_SITE_HOST}${path == "/" ? "" : path}`}
      />
      <meta property="og:site_name" content={title} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta
        property="og:image"
        content={`${env.NEXT_PUBLIC_SITE_HOST}/icons/og-preview.png`}
      />
      <link rel="apple-touch-icon" href="/icons/apple-touch.png" />
      <link rel="icon" sizes="any" href="/favicon.ico" />
      <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />

      <meta name="viewport" content="width=device-width, user-scalable=no" />
    </>
  )
}

export default getMetaTags
