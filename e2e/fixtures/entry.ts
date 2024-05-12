import { test as base } from "@playwright/test"
import { useNickname } from "utility/use-nickname"

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto("/")

    await useNickname(page, "Крутой ник")

    await use(page)
  }
})

export { expect } from "@playwright/test"
