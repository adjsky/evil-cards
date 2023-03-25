import React, { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import clsx from "clsx"

import { useIsomorphicLayoutEffect } from "@/lib/hooks"

import Close from "@/assets/close.svg"
import CrossMark from "@/assets/cross-mark.svg"
import ExclamationMark from "@/assets/exclamation-mark.svg"

import type { SnackbarProps, Severity, Colors } from "./types"

const isBrowser = typeof window != "undefined"

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

export const getIcon = (severity: Severity): JSX.Element => {
  switch (severity) {
    case "error":
      return <CrossMark />
    case "information":
      return <ExclamationMark />
  }
}

const Snackbar: React.FC<SnackbarProps> = ({
  animationDuration = 300,
  autoHideDuration = 5000,
  open = false,
  infinite = false,
  message,
  severity = "information",
  onClose
}) => {
  const [state, setState] = useState({
    display: open,
    openAnimation: open,
    closeAnimation: false
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const autoHideTimeout = useRef<NodeJS.Timeout | null>(null)

  const severityColor = getSeverityColor(severity)
  const icon = getIcon(severity)

  const shouldAutoHide = !infinite && autoHideDuration !== 0

  const stopAutoHide = () => {
    if (autoHideTimeout.current != null) {
      clearTimeout(autoHideTimeout.current)
      autoHideTimeout.current = null
    }
  }

  const cancelPreviousAnimations = () => {
    containerRef.current
      ?.getAnimations()
      .forEach((animation) => animation.cancel())
  }

  const triggerAutoHide = (duration: number) => {
    const timeout = setTimeout(() => {
      close()

      autoHideTimeout.current = null
    }, duration)

    autoHideTimeout.current = timeout
  }

  const show = () => {
    if (state.openAnimation || state.closeAnimation) {
      cancelPreviousAnimations()
    }
    stopAutoHide()

    if (shouldAutoHide) {
      triggerAutoHide(autoHideDuration + animationDuration)
    }

    setState({
      display: true,
      openAnimation: true,
      closeAnimation: false
    })
  }

  const close = () => {
    if (state.closeAnimation) {
      return
    }
    if (state.openAnimation) {
      cancelPreviousAnimations()
    }
    stopAutoHide()

    setState({
      display: true,
      openAnimation: false,
      closeAnimation: true
    })
  }

  useEffect(() => {
    return () => {
      stopAutoHide()
      cancelPreviousAnimations()
    }
  }, [])

  useIsomorphicLayoutEffect(() => {
    if (
      !containerRef.current ||
      (!state.closeAnimation && !state.openAnimation)
    ) {
      return
    }

    const animation = containerRef.current.animate(
      state.closeAnimation
        ? [{ opacity: 1 }, { opacity: 0 }]
        : [{ opacity: 0 }, { opacity: 1 }],
      {
        duration: animationDuration,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "forwards",
        id: state.closeAnimation ? "fade-out" : "fade-in"
      }
    )

    animation.onfinish = () => {
      setState({
        display: state.openAnimation,
        openAnimation: false,
        closeAnimation: false
      })

      if (state.closeAnimation && onClose) {
        onClose()
      }
    }
  }, [state])

  useIsomorphicLayoutEffect(() => {
    if (!open) {
      if (state.display) {
        close()
      }

      return
    }

    show()
  }, [open, message, severity])

  if (!isBrowser || !state.display) {
    return null
  }

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
      className="fixed top-3 left-1/2 z-50 flex w-11/12 min-w-0 max-w-full -translate-x-1/2 items-center rounded-xl py-3 px-3 sm:top-10 sm:py-4 sm:px-5 md:min-w-[350px] md:max-w-[440px]"
      onMouseEnter={() => !state.closeAnimation && stopAutoHide()}
      onMouseLeave={() =>
        !state.closeAnimation &&
        shouldAutoHide &&
        triggerAutoHide(autoHideDuration)
      }
    >
      <span>{icon}</span>
      <span
        style={{ color: severityColor.fg }}
        className={clsx(
          "ml-2 text-sm font-bold leading-tight sm:ml-5 sm:text-base",
          !infinite && "mr-5 sm:mr-8"
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

export default Snackbar
