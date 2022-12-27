import React from "react"
import clsx from "clsx"
import { Interweave } from "interweave"

import Cat from "@/assets/cat.svg"

const Card: React.FC<{
  author?: string
  text?: string
  disabled?: boolean
  lowerOpacity?: boolean
  onClick?: () => void
}> = ({ author, text, disabled, lowerOpacity, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex aspect-[120/167] w-full rounded-[0.25rem] bg-gray-100 p-2 text-left sm:w-[140px] sm:min-w-0 sm:max-w-full sm:rounded-lg sm:p-3",
        "transition-transform enabled:hover:-translate-y-1",
        lowerOpacity && "opacity-60",
        !text && "items-center justify-center"
      )}
      disabled={disabled}
    >
      <span
        className={clsx(
          text &&
            "flex h-full w-full flex-col justify-between whitespace-pre-line break-words text-[0.5rem] font-medium sm:text-xs sm:leading-normal",
          !text && "flex items-center justify-center"
        )}
      >
        {text ? <Interweave content={text} /> : <Cat />}
        {author && <span className="text-right">{author}</span>}
      </span>
    </button>
  )
}

export default Card
