import React, { useRef } from "react"
import clsx from "clsx"
import { Interweave } from "interweave"
import typo from "ru-typo"
import { Transition } from "@headlessui/react"
import { useAutoAnimate } from "@formkit/auto-animate/react"

import useSocket from "../hooks/use-socket"
import useScreenFactor from "../hooks/use-screen-factor"
import useTimeBar from "../hooks/use-time-bar"
import useLeavePreventer from "../hooks/use-leave-preventer"

import UserList from "../components/user-list"
import Card from "../components/card"

import type { Message as ReceiveMessage } from "@evil-cards/server/src/lib/ws/send"
import type { Message as SendMessage } from "@evil-cards/server/src/lib/ws/receive"
import type { GameState } from "../atoms"

const Game: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  useLeavePreventer()
  const { sendJsonMessage } = useSocket<SendMessage, ReceiveMessage>()

  const [cardsRef] = useAutoAnimate<HTMLDivElement>({
    disrespectUserMotionPreference: true,
    easing: "linear",
    duration: 300
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const screenStyles = useScreenFactor({
    ref: containerRef,
    px: 40,
    py: 40,
    disableOnMobile: true
  })
  const timeBarStyles = useTimeBar(gameState.votingEndsAt)

  const user = gameState.users.find((user) => user.id == gameState.userId)!
  const availableCardDisabled =
    gameState.status == "choosing" ||
    gameState.status == "choosingbest" ||
    user.master ||
    user.voted

  const handleTableCardClick = (userId: string) => {
    if (gameState.status == "choosing") {
      sendJsonMessage({ type: "choose", details: { userId } })
    } else {
      sendJsonMessage({ type: "choosebest", details: { userId } })
    }
  }

  return (
    <Transition
      className="mx-auto h-screen max-w-[500px] opacity-0 sm:relative sm:max-w-none"
      enter="transition-opacity duration-300"
      enterTo="opacity-100"
      show
      appear
    >
      <div
        className="flex h-screen flex-col sm:h-auto sm:items-center sm:justify-center sm:gap-3"
        style={screenStyles}
        ref={containerRef}
      >
        <div className="sm:hidden">
          <UserList users={gameState.users} variant="game" />
        </div>
        <div
          ref={cardsRef}
          className="flex w-full flex-auto flex-col items-center justify-around px-2 pb-2 sm:h-[342px] sm:flex-initial sm:flex-row sm:gap-[44px] sm:px-0 sm:pb-0"
        >
          <div className="aspect-[174/241] w-[115px] whitespace-pre-line rounded-md bg-red-500 p-3 text-[0.625rem] font-medium leading-[1.15] text-gray-100 sm:w-[174px] sm:rounded-lg sm:p-4 sm:text-sm">
            {
              <Interweave
                content={typo(gameState.redCard, { hyphens: true })}
              />
            }
          </div>
          {gameState.votes.length > 0 && (
            <div className="grid w-full grid-cols-5 grid-rows-2 gap-1 sm:w-auto sm:gap-2">
              {gameState.votes.map(({ text, userId, visible }) => (
                <Card
                  key={text}
                  text={visible ? text : undefined}
                  disabled={
                    !user.master ||
                    (visible && gameState.status != "choosingbest") ||
                    (!visible && gameState.status != "choosing")
                  }
                  onClick={() => {
                    handleTableCardClick(userId)
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-4 px-2 pb-10 sm:h-[364px] sm:px-0 sm:pb-0">
          <div className="hidden sm:block">
            <UserList users={gameState.users} variant="game" />
          </div>
          <div className="flex w-full flex-col gap-2 sm:gap-3">
            <div className="relative h-[10px] w-full rounded-lg bg-gray-200">
              <div
                className="absolute left-0 top-0 h-full rounded-lg bg-red-500"
                style={timeBarStyles}
              />
            </div>
            <div
              className={clsx(
                "grid grid-flow-col grid-rows-1 gap-1 overflow-auto sm:grid-flow-row sm:grid-rows-2 sm:gap-2 sm:overflow-visible",
                "auto-cols-[minmax(calc(20%-0.25rem*4/5),1fr)] grid-cols-[repeat(5,minmax(20%-0.25rem*4/5,1fr))]",
                "sm:grid-cols-[repeat(5,1fr)]"
              )}
            >
              {gameState.whiteCards.map((text) => (
                <Card
                  key={text}
                  text={text}
                  onClick={() =>
                    sendJsonMessage({ type: "vote", details: { text } })
                  }
                  disabled={availableCardDisabled}
                  lowerOpacity={availableCardDisabled}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Transition>
  )
}

export default Game
