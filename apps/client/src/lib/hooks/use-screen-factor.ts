import React, { useState, useEffect, useCallback } from "react"
import useIsomorphicLayoutEffect from "./use-isomorphic-layout-effect"
import type { RefObject } from "react"

type UseScreenFactorOptions = {
  // Reduce screen size in one or both dimensions.
  // Useful when you have some other content next to your container.
  reduceScreenSizeBy?: {
    x?: number
    y?: number
  }

  // Horizontal padding.
  px?: number

  // Vertical padding.
  py?: number

  // Reset styles if screen width <= 640px.
  disableOnMobile?: boolean

  // Reset styles if screen width >= stopAt.
  stopAt?: number
}

/**
 * Accepts HTMLElement `ref` and returns styles
 * to match the screen width (and height).
 *
 * The `ref` element should have fixed width and height
 * to properly compute the ending styles.
 *
 * **NOTE** the element using the returned styles will have an absolute position.
 */
const useScreenFactor = (
  ref: RefObject<HTMLElement>,
  options?: UseScreenFactorOptions
) => {
  const {
    reduceScreenSizeBy,
    px = 0,
    py = 0,
    disableOnMobile,
    stopAt
  } = options || {}

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
  }, [ref, px, py, reduceScreenSizeBy?.x, reduceScreenSizeBy?.y])

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
