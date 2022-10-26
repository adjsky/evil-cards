import React from "react"
import clsx from "clsx"
import { Interweave } from "interweave"
import typo from "ru-typo"

import { Cat } from "./icons"

const Card: React.FC<{
  text?: string
  onClick?: () => void
  disabled?: boolean
  lowerOpacity?: boolean
}> = ({ text, onClick, disabled, lowerOpacity }) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex aspect-[120/167] rounded-[0.25rem] bg-gray-100 p-2 text-left sm:w-[120px] sm:min-w-0 sm:max-w-full sm:rounded-lg sm:p-3",
        lowerOpacity && "opacity-60",
        !text && "items-center justify-center"
      )}
      disabled={disabled}
    >
      <span
        className={clsx(
          text &&
            "inline-block w-full whitespace-pre-line text-[0.5rem] font-medium leading-[1.15] sm:text-xs",
          !text && "flex items-center justify-center"
        )}
      >
        {text ? (
          <Interweave content={typo(text, { hyphens: true })} />
        ) : (
          <Cat width="50%" height="50%" />
        )}
      </span>
    </button>
  )
}

export default Card
