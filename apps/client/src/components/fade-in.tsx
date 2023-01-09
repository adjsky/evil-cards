import React from "react"
import clsx from "clsx"

const FadeIn: React.FC<
  React.PropsWithChildren<{
    className?: string
    enter?: string
  }>
> = ({ className, children }) => {
  return <div className={clsx(className, "animate-fade-in")}>{children}</div>
}

export default FadeIn
