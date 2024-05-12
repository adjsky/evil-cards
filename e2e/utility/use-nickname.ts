import type { Page } from "@playwright/test"

export async function useNickname(page: Page, nickname: string) {
  await page.getByTestId("nickname-toggle").click()
  await page.getByTestId("nickname-input").fill(nickname)
  await page.getByTestId("nickname-input").press("Enter")
}
