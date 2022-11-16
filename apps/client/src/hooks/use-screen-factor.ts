import React, { useState, useEffect, useCallback } from "react"
import useIsomorphicLayoutEffect from "./use-isomorphic-layout-effect"
import type { RefObject } from "react"

type UseScreenFactorProps = {
  ref: RefObject<HTMLElement>
  reduceScreenSizeBy?: {
    x?: number
    y?: number
  }
  px?: number
  py?: number
  disableOnMobile?: boolean
  stopAt?: number
}

const useScreenFactor = ({
  ref,
  reduceScreenSizeBy,
  px = 0,
  py = 0,
  disableOnMobile,
  stopAt
}: UseScreenFactorProps) => {
  const computeScale = useCallback(() => {
    if (!ref.current) {
      return 1
    }

    const reducedScreenWidth = window.innerWidth - (reduceScreenSizeBy?.x ?? 0)
    const reducedScreenHeight =
      window.innerHeight - (reduceScreenSizeBy?.y ?? 0)

    const computedWidth = ref.current.offsetWidth + px * 2
    const computedHeight = ref.current.offsetHeight + py * 2
    const scaledWidth = (computedWidth * reducedScreenHeight) / computedHeight

    if (scaledWidth > reducedScreenWidth) {
      return reducedScreenWidth / computedWidth
    }

    return reducedScreenHeight / computedHeight
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ref,
    ref.current?.offsetWidth,
    ref.current?.offsetHeight,
    px,
    py,
    reduceScreenSizeBy?.x,
    reduceScreenSizeBy?.y
  ])

  const [scaleFactor, setScaleFactor] = useState(1)
  useIsomorphicLayoutEffect(() => {
    setScaleFactor(computeScale())
  }, [computeScale])

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
    !ref.current ||
    (disableOnMobile && window.innerWidth <= 640) ||
    (stopAt && window.innerWidth > stopAt)
      ? {}
      : {
          transform: `scale(${scaleFactor})`,
          marginLeft: -ref.current.offsetWidth / 2,
          marginTop: -ref.current.offsetHeight / 2,
          position: "absolute",
          top: "50%",
          left: "50%"
        }

  return styles
}

export default useScreenFactor
