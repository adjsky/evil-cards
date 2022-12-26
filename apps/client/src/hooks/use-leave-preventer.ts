import { useEffect } from "react"

/**
 * Listen to beforeunload event to display
 * a pop-up warning when closing a tab.
 */
const useLeavePreventer = () => {
  useEffect(() => {
    const preventer = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", preventer)

    return () => {
      window.removeEventListener("beforeunload", preventer)
    }
  }, [])
}

export default useLeavePreventer
