import { expect, test } from "fixtures/entry"

test("Страница", async ({ page }) => {
  await expect(page).toHaveScreenshot()
})
