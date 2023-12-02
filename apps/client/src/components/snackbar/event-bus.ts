import { createEventBus } from "@/core/event-bus"

import type { SnackbarState } from "./types"

export const eventBus = createEventBus<{
  update: SnackbarState
  hideNotifications: undefined
}>()

export function notify(data: SnackbarState) {
  eventBus.emit("update", data)
}

export function hideNotifications() {
  eventBus.emit("hideNotifications")
}
