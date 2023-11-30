import { ReactComponent as CrossMark } from "@/assets/cross-mark.svg"
import { ReactComponent as ExclamationMark } from "@/assets/exclamation-mark.svg"

import type { Severity } from "./types"

const getIcon = (severity: Severity) => {
  switch (severity) {
    case "error":
      return <CrossMark />
    case "information":
      return <ExclamationMark />
  }
}

export default getIcon
