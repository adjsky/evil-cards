import { useCallback, useEffect, useState } from "react"

import type { CSSProperties, RefCallback } from "react"

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
 * to properly compute the final styles.
 *
 * **NOTE** the element using the returned styles will have an absolute position.
 */
const useScreenFactor = <T extends HTMLElement>(
  options?: UseScreenFactorOptions
): [CSSProperties, RefCallback<T>] => {
  const {
    reduceScreenSizeBy,
    px = 0,
    py = 0,
    disableOnMobile,
    stopAt
  } = options || {}

  const [scaleFactor, setScaleFactor] = useState(1)
  const [node, setNode] = useState<T | null>(null)

  const computeScale = useCallback(
    (node: T) => {
      const reducedScreenWidth =
        window.innerWidth - (reduceScreenSizeBy?.x ?? 0)
      const reducedScreenHeight =
        window.innerHeight - (reduceScreenSizeBy?.y ?? 0)

      const computedWidth = node.offsetWidth + px * 2
      const computedHeight = node.offsetHeight + py * 2
      const scaledWidth = (computedWidth * reducedScreenHeight) / computedHeight

      if (scaledWidth > reducedScreenWidth) {
        return reducedScreenWidth / computedWidth
      }

      return reducedScreenHeight / computedHeight
    },
    [px, py, reduceScreenSizeBy?.x, reduceScreenSizeBy?.y]
  )

  const refCallback = useCallback(
    (node: T | null) => {
      setNode(node)

      if (node) {
        setScaleFactor(computeScale(node))
      }
    },
    [computeScale]
  )

  useEffect(() => {
    if (!node) {
      return
    }

    const updateScaleFactor = () => {
      setScaleFactor(computeScale(node))
    }

    window.addEventListener("resize", updateScaleFactor)
    return () => {
      window.removeEventListener("resize", updateScaleFactor)
    }
  }, [node, computeScale])

  const styles: CSSProperties =
    node == null ||
    (disableOnMobile && window.innerWidth <= 640) ||
    (stopAt && window.innerWidth > stopAt)
      ? {}
      : {
          transform: `scale(${scaleFactor})`,
          marginLeft: -node.offsetWidth / 2,
          marginTop: -node.offsetHeight / 2,
          position: "absolute",
          top: "50%",
          left: "50%"
        }

  return [styles, refCallback]
}

export default useScreenFactor
