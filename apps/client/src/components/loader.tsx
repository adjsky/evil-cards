import React from "react"

import cn from "@/lib/functions/cn"

type LoaderProps = {
  width?: number
  height?: number
  className?: string
}

const Loader: React.FC<LoaderProps> = ({ width, height, className }) => (
  <svg
    className={cn("animate-spin", className)}
    style={
      width != undefined && height != undefined ? { width, height } : undefined
    }
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
  >
    <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
)

export default Loader
