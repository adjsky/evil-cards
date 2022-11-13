import React, { useRef } from "react"
import clsx from "clsx"
import { Interweave } from "interweave"
import { Transition } from "@headlessui/react"
import { useAutoAnimate } from "@formkit/auto-animate/react"

import useSocket from "../../hooks/use-socket"
import useScreenFactor from "../../hooks/use-screen-factor"
import useTimeBar from "../../hooks/use-time-bar"
import useLeavePreventer from "../../hooks/use-leave-preventer"

import UserList from "../../components/user-list"
import Card from "../../components/card"
import styles from "./game.module.css"

import type { Message as ReceiveMessage } from "@evil-cards/server/src/lib/ws/send"
import type { Message as SendMessage } from "@evil-cards/server/src/lib/ws/receive"
import type { GameState } from "../../atoms"

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
  const boardRef = useRef<HTMLDivElement>(null)
  const boardStyles = useScreenFactor({
    ref: boardRef,
    px: 0,
    py: 0,
    stopAt: 639,
    reduceScreenSizeBy: {
      y: 235
    }
  })
  const timeBarStyles = useTimeBar(
    gameState.configuration.votingDuration,
    gameState.votingEndsAt
  )

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
      className="mx-auto h-screen sm:relative"
      enter="transition-opacity duration-300"
      enterTo="opacity-100"
      enterFrom="opacity-0"
      show
      appear
    >
      <div
        className="flex h-screen flex-col items-center sm:h-auto sm:justify-center sm:gap-3"
        style={screenStyles}
        ref={containerRef}
      >
        <div className="w-full sm:hidden">
          <UserList users={gameState.users} variant="game" />
        </div>
        <div
          ref={cardsRef}
          className="relative flex w-full flex-auto items-center justify-center"
        >
          <div
            className={clsx(
              "flex items-center justify-center",
              gameState.votes.length > 0 && "sm:justify-between",
              styles["board"]
            )}
            style={boardStyles}
            ref={boardRef}
          >
            <div className={clsx("bg-red-500", styles["red-card"])}>
              <Interweave
                content={gameState.redCard}
                className="whitespace-pre-line break-words text-[0.625rem] font-medium text-gray-100 sm:text-sm sm:leading-normal"
              />
            </div>
            {gameState.votes.length > 0 && (
              <div className="sm:grid sm:w-auto sm:grid-cols-5 sm:grid-rows-2 sm:gap-2">
                {gameState.votes.map(({ text, userId, visible }, index) => (
                  <div
                    className={clsx(
                      styles["voted-card"],
                      styles[`card-${index + 1}`]
                    )}
                    key={text}
                  >
                    <Card
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex w-full gap-4 px-2 pb-2 sm:px-0 sm:pb-0">
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
                "auto-cols-[85px] sm:grid-cols-[repeat(5,1fr)]"
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
