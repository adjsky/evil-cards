export type Severity = "information" | "error"

export type Colors = {
  bg: string
  fg: string
}

export type SnackbarProps = {
  animationDuration?: number
  autoHideDuration?: number
}

export type SnackbarState = {
  infinite: boolean
  message: string
  severity: Severity
}
