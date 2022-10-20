import { useState } from "react"
import Snackbar from "./index"

import type { SnackbarProps } from "./types"

type Props = Omit<SnackbarProps, "message" | "open" | "severity">
type State = Pick<SnackbarProps, "message" | "open" | "severity">

type UpdateFunction = (state: State) => void
type ReturnObject = {
  updateSnackbar: UpdateFunction
  Snackbar: JSX.Element
}

const useSnackbar = (props?: Props): ReturnObject => {
  const checkedProps = props || {}

  const [state, setState] = useState<State>({})

  return {
    updateSnackbar: setState,
    Snackbar: (
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
}

export default useSnackbar
