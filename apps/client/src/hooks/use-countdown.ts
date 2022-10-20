import { useState, useCallback } from "react"

const useCountdown = () => {
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [running, setRunning] = useState(false)

  const start = useCallback((seconds: number) => {
    setSecondsLeft(seconds)
    setRunning(true)

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev == 1) {
          clearInterval(interval)
          setRunning(false)
        }

        return prev == 1 ? 1 : prev - 1
      })
    }, 1000)
  }, [])

  return { start, secondsLeft, running }
}

export default useCountdown
