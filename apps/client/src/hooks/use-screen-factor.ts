import { useState, useEffect } from "react"

const useScreenFactor = () => {
  const [scaleFactor, setScaleFactor] = useState(
    window.innerWidth < 880 ? window.innerWidth / 880 : 1
  )

  useEffect(() => {
    const computeScale = () => {
      if (window.innerWidth < 880) {
        setScaleFactor(window.innerWidth / 880)
      } else {
        setScaleFactor(1)
      }
    }
    window.addEventListener("resize", computeScale)

    return () => {
      window.removeEventListener("resize", computeScale)
    }
  })

  return scaleFactor
}

export default useScreenFactor
