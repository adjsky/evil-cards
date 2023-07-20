import { useEffect, useRef } from "react"

import usePrevious from "./use-previous"

const usePreviousN2 = <T>(value: T) => {
  const ref = useRef<[T | undefined, T | undefined]>([undefined, undefined])
  const previousValue = usePrevious(value)

  useEffect(() => {
    if (previousValue == undefined) {
      return
    }

    ref.current[0] = ref.current[1]
    ref.current[1] = value
  }, [value, previousValue])

  return ref.current
}

export default usePreviousN2
