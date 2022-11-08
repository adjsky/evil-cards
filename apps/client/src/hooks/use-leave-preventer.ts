import { useEffect } from "react"

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
