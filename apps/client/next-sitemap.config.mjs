/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl:
    process.env.NEXT_PUBLIC_PRODUCTION_HOST ?? "https://evilcards.online",
  generateRobotsTxt: true,
  exclude: ["/room"]
}

export default config
