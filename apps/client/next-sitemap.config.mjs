/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_HOST ?? "https://evilcards.online",
  generateRobotsTxt: true,
  exclude: ["/room"]
}

export default config
