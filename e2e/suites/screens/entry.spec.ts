import { expect, test } from "fixtures/entry"

test("Страница", async ({ page }) => {
  await expect(page).toHaveScreenshot()
})

test("Аватар", async ({ page }) => {
  await page.getByTestId("avatar-prev").click()
  await expect(page).toHaveScreenshot()

  await page.getByTestId("avatar-next").click()
  await expect(page).toHaveScreenshot()

  await page.getByTestId("avatar-next").click()
  await expect(page).toHaveScreenshot()
})
