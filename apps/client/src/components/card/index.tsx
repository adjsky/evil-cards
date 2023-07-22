import clsx from "clsx"
import { Interweave } from "interweave"
import React, { useEffect, useRef } from "react"

import { usePrevious } from "@/lib/hooks"

import Cat from "@/assets/cats/regular.svg"

import styles from "./card.module.css"

const Card: React.FC<{
  author?: string
  text?: string
  disabled?: boolean
  lowerOpacity?: boolean
  flipable?: boolean
  onClick?: () => void
}> = ({ author, text, disabled, lowerOpacity, flipable, onClick }) => {
  const flipableCardRef = useRef<HTMLSpanElement>(null)

  const prevText = usePrevious(text)
  useEffect(() => {
    if (!text || prevText || !flipable) {
      return
    }

    flipableCardRef.current?.animate([{ transform: "rotateY(180deg)" }], {
      duration: 500,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      fill: "forwards"
    })
  }, [text, prevText, flipable])

  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex aspect-[120/167] w-full text-left sm:w-[140px] sm:min-w-0 sm:max-w-full",
        "transition-transform enabled:hover:-translate-y-1",
        lowerOpacity && "opacity-60",
        !text && "items-center justify-center",
        flipable && styles["flipable-container"]
      )}
      disabled={disabled}
    >
      <span
        ref={flipableCardRef}
        className={clsx(
          "flex h-full w-full whitespace-pre-line break-words rounded-[0.25rem] bg-gray-100 p-2 text-[0.5rem] font-medium sm:rounded-lg sm:p-3 sm:text-xs sm:leading-normal",
          text && "flex-col justify-between",
          !text && "items-center justify-center",
          flipable && styles["flipable-card"]
        )}
      >
        {flipable && (
          <>
            <Cat
              className={clsx(
                styles["front"],
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              )}
            />
            {text && <Interweave content={text} className={styles["back"]} />}
          </>
        )}
        {!flipable && (text ? <Interweave content={text} /> : <Cat />)}
        {author && (
          <span
            className={clsx(
              "block overflow-hidden text-ellipsis whitespace-nowrap text-right",
              flipable && styles["back"]
            )}
          >
            {author}
          </span>
        )}
      </span>
    </button>
  )
}

export default Card
