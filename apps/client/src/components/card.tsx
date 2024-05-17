import { Interweave } from "interweave"
import React, { useEffect, useRef } from "react"

import cn from "@/lib/functions/cn"
import usePrevious from "@/lib/hooks/use-previous"

import { ReactComponent as Cat } from "@/assets/cats/regular.svg"

import styles from "./card.module.css"

const Card: React.FC<{
  author?: string
  text?: string
  disabled?: boolean
  lowerOpacity?: boolean
  flipable?: boolean
  testId?: string
  onClick?: () => void
}> = ({ author, text, disabled, lowerOpacity, flipable, testId, onClick }) => {
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
      data-testid={testId}
      onClick={onClick}
      className={cn(
        "flex aspect-[65/90] w-full text-left sm:w-[140px] sm:min-w-0 sm:max-w-full",
        "transition-transform enabled:hover:-translate-y-1",
        lowerOpacity && "opacity-60",
        !text && "items-center justify-center",
        flipable && styles["flipable-container"]
      )}
      disabled={disabled}
    >
      <span
        ref={flipableCardRef}
        className={cn(
          "flex h-full w-full whitespace-pre-line break-words rounded-[0.25rem] bg-gray-100 px-1.5 py-2 text-[0.5rem] font-medium sm:rounded-lg sm:px-2.5 sm:py-3 sm:text-xs sm:leading-normal",
          text && "flex-col justify-between",
          !text && "items-center justify-center",
          flipable && styles["flipable-card"]
        )}
      >
        {flipable && (
          <>
            <Cat
              className={cn(
                styles["front"],
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              )}
            />
            {text && <Interweave content={text} className={styles["back"]} />}
          </>
        )}
        {!flipable && (text ? <Interweave content={text} /> : <Cat />)}
        {author && (
          <span
            className={cn(
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
