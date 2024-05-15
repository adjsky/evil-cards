import { type Browser, expect } from "@playwright/test"

import { useAvatar } from "./use-avatar"
import { useNickname } from "./use-nickname"

export async function addPlayer(
  browser: Browser,
  inviteLink: string,
  nickname: string
) {
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(inviteLink)

  await useNickname(page, nickname)
  await useAvatar(page, 1)

  await page.getByTestId("connect-session").click()

  await expect(page.getByTestId("start-game")).toBeInViewport()

  return page
}
