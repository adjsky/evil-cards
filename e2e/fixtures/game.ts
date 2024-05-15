import { test as base, expect, type Page } from "@playwright/test"
import { addPlayer } from "utility/add-player"
import { readFromClipboard } from "utility/read-from-clipboard"
import { useAvatar } from "utility/use-avatar"
import { useNickname } from "utility/use-nickname"

export const test = base.extend<{
  nPlayers: number
  players: Page[]
}>({
  nPlayers: [3, { option: true }],

  async players({ page, nPlayers, browser }, use) {
    const players: Page[] = [page]

    await page.goto("/")

    await useNickname(page, "Игрок 1")
    await useAvatar(page, 1)
    await page.getByTestId("connect-session").click()

    await page.getByTestId("invite-player").click()
    const inviteLink = await readFromClipboard(page)

    for (let i = 2; i <= nPlayers; i++) {
      const playerPage = await addPlayer(browser, inviteLink, `Игрок ${i}`)
      players.push(playerPage)
    }

    await page.getByTestId("start-game").click()
    await expect(page.getByTestId("red-card")).toBeInViewport()

    await use(players)
  }
})

export { expect } from "@playwright/test"
