import React, { useCallback, useEffect, useRef, useState } from "react"
import { createPortal, flushSync } from "react-dom"

import raise from "@/core/raise"

import cn from "@/lib/functions/cn"

import { ReactComponent as Close } from "@/assets/close/square.svg"

import { eventBus } from "./event-bus"
import { getIcon } from "./utility"

import type { Colors, Severity, SnackbarProps, SnackbarState } from "./types"

const getSeverityColor = (severity: Severity): Colors => {
  switch (severity) {
    case "error":
      return {
        bg: "#811212",
        fg: "#DF4B4B"
      }
    case "information":
      return {
        bg: "#555555",
        fg: "#FFFFFF"
      }
  }
}

export const Snackbar: React.FC<SnackbarProps> = ({
  animationDuration = 300,
  autoHideDuration = 5000
}) => {
  const [state, setState] = useState<SnackbarState | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const autoHideTimeout = useRef<NodeJS.Timeout | null>(null)

  const stopAutoHide = () => {
    if (autoHideTimeout.current != null) {
      clearTimeout(autoHideTimeout.current)
      autoHideTimeout.current = null
    }
  }

  const cancelAnimations = () => {
    containerRef.current
      ?.getAnimations()
      .forEach((animation) => animation.cancel())
  }

  const animate = useCallback(
    (element: HTMLDivElement, action: "close" | "open") => {
      return element.animate(
        action == "close"
          ? [{ opacity: 1 }, { opacity: 0 }]
          : [{ opacity: 0 }, { opacity: 1 }],
        {
          duration: animationDuration,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          fill: "forwards",
          id: action == "close" ? "fade-out" : "fade-in"
        }
      )
    },
    [animationDuration]
  )

  const close = useCallback(() => {
    if (!containerRef.current) {
      raise("Can't close hidden snackbar")
    }

    const animation = animate(containerRef.current, "close")

    animation.onfinish = () => {
      setState(null)
    }
  }, [animate])

  const triggerAutoHide = useCallback(
    (duration: number) => {
      const timeout = setTimeout(() => {
        autoHideTimeout.current = null

        close()
      }, duration)

      autoHideTimeout.current = timeout
    },
    [close]
  )

  const show = useCallback(
    (state: SnackbarState) => {
      if (!containerRef.current) {
        raise("Container is not mounted")
      }

      cancelAnimations()
      stopAutoHide()

      const shouldAutoHide = !state.infinite && autoHideDuration !== 0

      if (shouldAutoHide) {
        triggerAutoHide(autoHideDuration + animationDuration)
      }

      animate(containerRef.current, "open")
    },
    [animate, animationDuration, autoHideDuration, triggerAutoHide]
  )

  eventBus.useSubscription("update", (updatedState) => {
    flushSync(() => {
      setState(updatedState)
    })

    show(updatedState)
  })

  eventBus.useSubscription("hideNotifications", () => {
    if (!containerRef.current) {
      return
    }

    stopAutoHide()
    close()
  })

  useEffect(() => {
    return () => {
      stopAutoHide()
      cancelAnimations()
    }
  }, [])

  if (!state) {
    return null
  }

  const { severity, infinite, message } = state

  const severityColor = getSeverityColor(state.severity)
  const icon = getIcon(severity)

  return createPortal(
    <div
      role="alert"
      ref={containerRef}
      style={{
        background: severityColor.bg,
        animationDuration: animationDuration / 1000 + "s",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: severityColor.fg
      }}
      className="fixed left-1/2 top-3 z-50 flex w-11/12 min-w-0 max-w-full -translate-x-1/2 items-center rounded-xl px-3 py-3 sm:top-10 sm:px-5 sm:py-4 md:min-w-[350px] md:max-w-[440px]"
    >
      <span>{icon}</span>
      <span
        style={{ color: severityColor.fg }}
        className={cn(
          "ml-2 text-sm font-bold leading-tight sm:ml-5 sm:text-base",
          !infinite && "mr-8 sm:mr-6"
        )}
      >
        {message}
      </span>
      {!infinite && (
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2"
          onClick={close}
          type="button"
          tabIndex={0}
          aria-label="Close"
        >
          <Close stroke={severityColor.fg} />
        </button>
      )}
    </div>,
    document.body
  )
}
