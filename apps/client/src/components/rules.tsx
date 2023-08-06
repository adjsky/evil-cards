import Image from "next/image"
import React, { useState } from "react"

import styles from "./rules.module.css"

const rules = [
  "Всем игрокам раздаётся по 10 белых карт. На экране появляется красная карта",
  "Игроки дополняют предложение своей белой картой",
  "Ведущий зачитывает варианты и выбирает самую смешную карту",
  "Побеждает самый смешной вариант по мнению ведущего",
  "Игрок, заработавший 10 очков, побеждает!"
]

const Rules: React.FC = () => {
  const [currentRuleIndex, setCurrentRuleIndex] = useState(0)

  return (
    <>
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <div className="relative flex max-h-[210px] w-full max-w-[210px] flex-auto items-center justify-center">
          <Image
            src={`/assets/rules/${currentRuleIndex + 1}.svg`}
            alt={`Правило ${currentRuleIndex + 1}`}
            className="object-contain"
            fill
          />
        </div>
        <p className="text-center text-base font-bold uppercase text-gray-100 sm:text-xl">
          {currentRuleIndex + 1}. {rules[currentRuleIndex]}
        </p>
      </div>
      <NextButtons
        count={5}
        current={currentRuleIndex}
        onNext={setCurrentRuleIndex}
        running
      />
    </>
  )
}

const NextButtons: React.FC<{
  count: number
  current: number
  running?: boolean
  onNext?: (index: number) => void
}> = ({ count, current, running, onNext }) => {
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <button
          className="relative"
          aria-label={`Слайд ${index + 1}`}
          key={index}
          onClick={() => onNext && onNext(index)}
        >
          <svg
            height={30}
            width={30}
            className={styles["circle-progress"]}
            data-running={running && current == index}
            onAnimationEnd={() => {
              if (current == count - 1) {
                onNext && onNext(0)
              } else {
                onNext && onNext(current + 1)
              }
            }}
          >
            <circle
              cx={15}
              cy={15}
              r={14}
              stroke="#FFFFFF"
              strokeWidth={2}
              fill="#2A2A2A"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute left-1/2 top-1/2 h-[21px] w-[21px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-100"></div>
        </button>
      ))}
    </div>
  )
}

export default Rules
