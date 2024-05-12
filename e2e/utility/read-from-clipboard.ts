import type { Page } from "@playwright/test"

export function readFromClipboard(page: Page) {
  return page.evaluate<string>("navigator.clipboard.readText()")
}
