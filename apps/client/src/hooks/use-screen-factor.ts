import React, { useState, useEffect, useCallback } from "react"
import useIsomorphicLayoutEffect from "./use-isomorphic-layout-effect"
import type { RefObject } from "react"

type UseScreenFactorProps = {
  ref: RefObject<HTMLElement>
  px?: number
  py?: number
  disableOnMobile?: boolean
}

const useScreenFactor = ({
  ref,
  px = 0,
  py = 0,
  disableOnMobile
}: UseScreenFactorProps) => {
  const computeScale = useCallback(() => {
    if (!ref.current) {
      return 1
    }

    const computedWidth = ref.current.offsetWidth + px * 2
    const computedHeight = ref.current.offsetHeight + py * 2
    const scaledWidth = (computedWidth * window.innerHeight) / computedHeight

    if (scaledWidth > window.innerWidth) {
      return window.innerWidth / computedWidth
    }

    return window.innerHeight / computedHeight
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, ref.current?.offsetWidth, ref.current?.offsetHeight, px, py])

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
    !ref.current || (disableOnMobile && window.innerWidth <= 640)
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
