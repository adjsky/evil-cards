import clsx from "clsx"
import React, { forwardRef } from "react"

const FadeIn = forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<{
    className?: string
    enter?: string
    duration?: number
    disabled?: boolean
  }>
>(({ className, children, duration = 400, disabled }, ref) => {
  return (
    <div
      ref={ref}
      className={clsx(className, !disabled && "animate-fade-in")}
      style={{ animationDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
})

FadeIn.displayName = "FadeIn"

export default FadeIn
