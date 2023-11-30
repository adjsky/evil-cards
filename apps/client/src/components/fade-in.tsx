import React, { forwardRef } from "react"

import cn from "@/lib/functions/cn"

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
      className={cn(className, !disabled && "animate-fade-in")}
      style={{ animationDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
})

FadeIn.displayName = "FadeIn"

export default FadeIn
