import React, { useEffect, useState } from "react"
import { useAtom } from "jotai"
import dynamic from "next/dynamic"
import clsx from "clsx"

import { gameStateAtom } from "../atoms"
import { useSocket } from "../ws/hooks"
import useToggle from "../hooks/use-toggle"
import useCountdown from "../hooks/use-countdown"
import useScreenFactor from "../hooks/use-screen-factor"

import { Logo } from "../components/icons"
import UserList from "../components/user-list"

import type { Message as ReceiveMessage } from "@kado/schemas/dist/client/receive"
import type { Message as SendMessage } from "@kado/schemas/dist/client/send"

const Waiting: React.FC = () => {
  const [gameState, setGameState] = useAtom(gameStateAtom)
  const scaleFactor = useScreenFactor()
  const { start, secondsLeft, running } = useCountdown()
  const visible =
    gameState?.session.state == "waiting" || gameState?.session.state == "end"
  const { lastJsonMessage, sendJsonMessage } = useSocket<
    SendMessage,
    ReceiveMessage
  >({
    onJsonMessage(data) {
      if (!visible) {
        return
      }

      if (data.type == "votingstarted") {
        setGameState({
          ...gameState,
          session: data.details.session,
          whiteCards: data.details.whiteCards
        })
      }

      if (data.type == "disconnected") {
        setGameState({ ...gameState, session: data.details.session })
      }

      if (data.type == "gamestart") {
        start(3)
      }
    }
  })

  if (!visible) {
    return null
  }

  const user = gameState.session.users.find(
    (user) => user.id == gameState.userId
  )
  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-10">
      <div
        className="flex flex-col items-center justify-center gap-6"
        style={{ transform: `scale(${scaleFactor})` }}
      >
        <Logo />
        <div className="flex w-[850px] gap-4">
          <div className="h-[500px]">
            <UserList users={gameState.session.users} variant="waiting" />
          </div>
          <div className="flex w-full flex-col gap-6">
            <div className="flex h-full w-full flex-col rounded-lg border-2 border-gray-200 p-4">
              <h2 className="text-center text-base font-bold text-gray-100">
                ПРАВИЛА
              </h2>
            </div>
            <div className="flex w-full justify-center gap-6">
              <DynamicInviteButton id={gameState.session.id} />
              <button
                onClick={() => {
                  sendJsonMessage({ type: "startgame" })
                }}
                className={clsx(
                  "w-32 rounded-lg bg-red-500 py-4 text-xl leading-none text-gray-100 transition-colors enabled:hover:bg-gray-100 enabled:hover:text-red-500",
                  !user.host && "opacity-50"
                )}
                disabled={lastJsonMessage?.type == "gamestart" || !user.host}
              >
                {lastJsonMessage?.type == "gamestart" ? secondsLeft : "НАЧАТЬ"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const InviteButton: React.FC<{ id: string }> = ({ id }) => {
  const [copied, toggleCopied] = useToggle()
  useEffect(() => {
    if (!copied) {
      return
    }

    const timeout = setTimeout(toggleCopied, 1000)
    return () => {
      clearTimeout(timeout)
    }
  }, [copied, toggleCopied])

  return (
    <div className="relative">
      <button
        className="rounded-lg border-gray-100 bg-gray-100 px-5 py-4 text-xl leading-none text-gray-900"
        onClick={async () => {
          await navigator.clipboard.writeText(
            `${window.location.href}?sessionId=${id}`
          )

          !copied && toggleCopied()
        }}
      >
        ПРИГЛАСИТЬ
      </button>
      <span
        className={clsx(
          "absolute left-1/2 -bottom-[25px] -translate-x-1/2 text-xs font-bold tracking-wider text-gold-500 opacity-0 transition-opacity",
          copied && "opacity-100"
        )}
      >
        СКОПИРОВАНО
      </span>
    </div>
  )
}
const DynamicInviteButton = dynamic(() => Promise.resolve(InviteButton), {
  ssr: false
})

export default Waiting
