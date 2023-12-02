import { useSetAtom } from "jotai"
import { useCallback, useRef } from "react"

import { hideNotifications } from "@/components/snackbar"

import { reconnectingSessionAtom, sessionAtom } from "../atoms/session"

type OnBackProps = {
  screen: HTMLElement
  closeSocket: () => void
  resetSocketUrl: () => void
}

const useLeaveSession = () => {
  const leaving = useRef(false)
  const setReconnectingSession = useSetAtom(reconnectingSessionAtom)
  const setSession = useSetAtom(sessionAtom)

  const leaveSession = useCallback(
    ({ screen, closeSocket, resetSocketUrl }: OnBackProps) => {
      if (leaving.current) {
        return
      }

      const handleAnimationFinish = () => {
        setSession(null)
        hideNotifications()
        setReconnectingSession(false)

        closeSocket()
        resetSocketUrl()
      }

      leaving.current = true

      const animation = screen.animate([{ opacity: 1 }, { opacity: 0 }], {
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        duration: 100,
        fill: "forwards"
      })

      if (animation) {
        animation.onfinish = handleAnimationFinish
      } else {
        handleAnimationFinish()
      }
    },
    [setReconnectingSession, setSession]
  )

  return { leaveSession }
}

export default useLeaveSession
