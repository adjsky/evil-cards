import type { Page } from "@playwright/test"

// TODO: share AVAILABLE_AVATARS between client and e2e

const AVAILABLE_AVATARS = 21

export async function useAvatar(page: Page, id: number) {
  const prevButtonLocator = page.getByTestId("avatar-prev")
  const nextButtonLocator = page.getByTestId("avatar-next")

  const rawCurrentAvatarId = await page
    .getByTestId("avatar")
    .getAttribute("data-test-avatar-id")

  if (rawCurrentAvatarId == null) {
    throw new Error("[data-test-avatar-id] is not defined on avatar image")
  }

  const currentAvatarId = Number(rawCurrentAvatarId)

  if (currentAvatarId == id) {
    return
  }

  const nIterationsPrev =
    id < currentAvatarId
      ? currentAvatarId - id
      : currentAvatarId - 1 + AVAILABLE_AVATARS - currentAvatarId

  const nIterationsNext =
    id > currentAvatarId
      ? id - currentAvatarId
      : AVAILABLE_AVATARS - currentAvatarId + id

  const nIterations = Math.min(nIterationsNext, nIterationsPrev)

  for (let i = 0; i < nIterations; i++) {
    const locator =
      nIterationsNext > nIterationsPrev ? prevButtonLocator : nextButtonLocator
    await locator.click()
  }
}
