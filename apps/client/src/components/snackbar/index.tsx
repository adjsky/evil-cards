import React, { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import clsx from "clsx"

import useIsomorphicLayoutEffect from "../../hooks/use-isomorphic-layout-effect"

import { Close, CrossMark, ExclamationMark } from "../icons"

import type { SnackbarProps, Severity, Colors } from "./types"

const isBrowser = typeof window != "undefined"

const getSeverityColor = (severity: Severity): Colors => {
  switch (severity) {
    case "error":
      return {
        bg: "#DF4B4B1A",
        fg: "#DF4B4B"
      }
    case "information":
      return {
        bg: "#FFFFFF1A",
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
  const closeTimeout = useRef<NodeJS.Timeout | null>(null)
  const showTimeout = useRef<NodeJS.Timeout | null>(null)

  const severityColor = getSeverityColor(severity)
  const icon = getIcon(severity)

  const shouldAutoHide = autoHideDuration !== 0

  const resetAnimation = () => {
    if (!containerRef.current) {
      return
    }

    containerRef.current.style.animation = "none"

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    containerRef.current.offsetHeight // start reflow

    containerRef.current.style.removeProperty("animation")
    containerRef.current.style.animationDuration =
      animationDuration / 1000 + "s"
  }

  const stopAutoHide = () => {
    if (autoHideTimeout.current != null) {
      clearTimeout(autoHideTimeout.current)
      autoHideTimeout.current = null
    }
  }

  const stopClosing = () => {
    if (closeTimeout.current != null) {
      clearTimeout(closeTimeout.current)
      closeTimeout.current = null
    }
  }

  const stopShowing = () => {
    if (showTimeout.current != null) {
      clearTimeout(showTimeout.current)
      showTimeout.current = null
    }
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
      resetAnimation()
    }

    if (state.openAnimation) {
      stopShowing()
    }

    if (state.closeAnimation) {
      stopClosing()
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

    const timeout = setTimeout(() => {
      showTimeout.current = null

      setState({
        display: true,
        openAnimation: false,
        closeAnimation: false
      })
    }, animationDuration)

    showTimeout.current = timeout
  }

  const close = () => {
    if (state.closeAnimation) {
      return
    }

    stopAutoHide()

    if (state.openAnimation) {
      resetAnimation()
      stopShowing()
    }

    setState({
      display: true,
      openAnimation: false,
      closeAnimation: true
    })

    const timeout = setTimeout(() => {
      closeTimeout.current = null

      setState({
        display: false,
        openAnimation: false,
        closeAnimation: false
      })

      onClose && onClose()
    }, animationDuration)

    closeTimeout.current = timeout
  }

  useEffect(() => {
    return () => {
      stopAutoHide()
      stopClosing()
      stopShowing()
    }
  }, [])

  useIsomorphicLayoutEffect(() => {
    if (!open) {
      return
    }

    show()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      className={clsx(
        "fixed top-10 left-1/2 flex w-11/12 min-w-0 max-w-full -translate-x-1/2 items-center rounded-xl py-4 px-5 md:min-w-[350px] md:max-w-[440px]",
        state.openAnimation && "fade-open",
        state.closeAnimation && "fade-close"
      )}
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
        className="ml-5 mr-8 text-base font-bold leading-tight"
      >
        {message}
      </span>
      <button
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2"
        onClick={close}
        type="button"
        tabIndex={0}
        aria-label="Close"
      >
        <Close fill={severityColor.fg} />
      </button>
    </div>,
    document.body
  )
}

export default Snackbar
