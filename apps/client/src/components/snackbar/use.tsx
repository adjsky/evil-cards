import { useState } from "react"

import { createEventBus } from "@/core/event-bus"

import Snackbar from "./index"

import type { SnackbarProps } from "./types"

type Props = Omit<SnackbarProps, "message" | "open" | "severity">
type State = Pick<SnackbarProps, "message" | "open" | "severity" | "infinite">

type Events = {
  update: Partial<State>
}
const eventBus = createEventBus<Events>()

export const useSnackbar = (props?: Props) => {
  const checkedProps = props || {}

  const [state, setState] = useState<State>({})

  eventBus.useSubscription("update", (data) =>
    setState((prev) => ({ ...prev, ...data }))
  )

  return (
    <Snackbar
      {...checkedProps}
      {...state}
      onClose={() => {
        setState((prev) => ({ ...prev, open: false }))
        checkedProps?.onClose && checkedProps.onClose()
      }}
    />
  )
}

export function updateSnackbar(data: Partial<State>) {
  eventBus.emit("update", data)
}
