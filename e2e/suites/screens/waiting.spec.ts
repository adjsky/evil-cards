import { expect, test } from "fixtures/waiting"
import { addPlayer } from "utility/add-player"
import { readFromClipboard } from "utility/read-from-clipboard"

test("Список игроков", async ({ page, browser }) => {
  await expect(page.getByTestId("player-list")).toHaveScreenshot()

  await page.getByTestId("invite-player").click()
  const inviteLink = await readFromClipboard(page)

  await addPlayer(browser, inviteLink, "Игрок 2")
  await addPlayer(browser, inviteLink, "Игрок 3")

  await expect(page.getByTestId("player-list")).toHaveScreenshot()
})

test("Чат", async ({ page, browser }) => {
  await expect(page.getByTestId("chat")).toHaveScreenshot()

  await page.getByTestId("chat-input").fill("текст")
  await page.getByTestId("chat-input").press("Enter")

  await expect(page.getByTestId("chat-message")).toHaveCount(1)
  await expect(page.getByTestId("chat")).toHaveScreenshot()

  await page.getByTestId("invite-player").click()
  const inviteLink = await readFromClipboard(page)

  const page2 = await addPlayer(browser, inviteLink, "Игрок")

  await expect(page2.getByTestId("chat")).toHaveScreenshot()

  await page.getByTestId("chat-input").fill("text")
  await page.getByTestId("chat-input").press("Enter")

  await expect(page.getByTestId("chat-message")).toHaveCount(2)
  await expect(page2.getByTestId("chat-message")).toHaveCount(1)

  await Promise.all([
    expect(page.getByTestId("chat")).toHaveScreenshot(),
    expect(page2.getByTestId("chat")).toHaveScreenshot()
  ])

  await page2.getByTestId("chat-input").fill("еще текст")
  await page2.getByTestId("chat-input").press("Enter")

  await expect(page.getByTestId("chat-message")).toHaveCount(3)
  await expect(page2.getByTestId("chat-message")).toHaveCount(2)

  await Promise.all([
    expect(page.getByTestId("chat")).toHaveScreenshot(),
    expect(page2.getByTestId("chat")).toHaveScreenshot()
  ])
})

test.describe("Возвращение на главный экран", () => {
  test("Через кнопку", async ({ page }) => {
    await page.getByTestId("back-button").click()
    await expect(page.getByTestId("connect-session")).toBeInViewport()
  })

  test("Через браузер", async ({ page }) => {
    await page.goBack()
    await expect(page.getByTestId("connect-session")).toBeInViewport()
  })
})
