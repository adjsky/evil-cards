import React, { useState, useEffect, useCallback } from "react"

type UseScreenFactorProps = {
  width: number
  height: number
  px?: number
  py?: number
}

const useScreenFactor = ({
  width,
  height,
  px = 0,
  py = 0
}: UseScreenFactorProps) => {
  const computeScale = useCallback(() => {
    const computedWidth = width + px * 2
    const computedHeight = height + py * 2
    const scaledWidth = (computedWidth * window.innerHeight) / computedHeight

    if (
      window.innerHeight < computedHeight &&
      window.innerWidth >= scaledWidth
    ) {
      return window.innerHeight / computedHeight
    }

    if (
      window.innerHeight < computedHeight &&
      window.innerWidth < scaledWidth
    ) {
      return window.innerWidth / computedWidth
    }

    if (window.innerHeight < computedHeight) {
      return window.innerHeight / computedWidth
    }

    if (window.innerWidth < computedWidth) {
      return window.innerWidth / computedWidth
    }

    return 1
  }, [width, height, px, py])

  const [scaleFactor, setScaleFactor] = useState(computeScale())

  useEffect(() => {
    const callback = () => {
      setScaleFactor(computeScale())
    }

    window.addEventListener("resize", callback)

    return () => {
      window.removeEventListener("resize", callback)
    }
  }, [computeScale])

  const styles: React.CSSProperties =
    window.innerWidth < 640
      ? {}
      : {
          transform: `scale(${scaleFactor})`,
          marginLeft: -width / 2,
          marginTop: -height / 2,
          position: "absolute",
          top: "50%",
          left: "50%"
        }

  return styles
}

export default useScreenFactor
