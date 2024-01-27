import React from "react"

import cn from "@/lib/functions/cn"

const ExternalUnderlineLink: React.FC<
  React.PropsWithChildren<
    React.DetailedHTMLProps<
      React.AnchorHTMLAttributes<HTMLAnchorElement>,
      HTMLAnchorElement
    >
  >
> = ({ children, className, ...props }) => {
  return (
    <a
      className={cn(
        className,
        "text-blue underline decoration-transparent transition-colors hover:decoration-current"
      )}
      {...props}
    >
      {children}
    </a>
  )
}

export default ExternalUnderlineLink
