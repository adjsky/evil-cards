import React, { useEffect } from "react"
import clsx from "clsx"

import useSocket from "../hooks/use-socket"
import useToggle from "../hooks/use-toggle"
import useCountdown from "../hooks/use-countdown"
import useScreenFactor from "../hooks/use-screen-factor"

import Logo from "../components/logo"
import UserList from "../components/user-list"
import Rules from "../components/rules"

import type { Message as ReceiveMessage } from "@evil-cards/server/src/lib/ws/send"
import type { Message as SendMessage } from "@evil-cards/server/src/lib/ws/receive"
import type { GameState } from "../atoms"

const Waiting: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  const screenStyles = useScreenFactor({
    width: 850,
    height: 633,
    px: 40,
    py: 40
  })
  const { start, secondsLeft } = useCountdown()
  const { lastJsonMessage, sendJsonMessage } = useSocket<
    SendMessage,
    ReceiveMessage
  >({
    onJsonMessage(data) {
      if (data.type == "gamestart") {
        start(3)
      }
    }
  })

  const handleStart = () => {
    sendJsonMessage({ type: "startgame" })
  }

  const user = gameState.users.find((user) => user.id == gameState.userId)!
  const lowerButtonOpacity =
    !user.host && (gameState.status == "waiting" || gameState.status == "end")

  return (
    <>
      <div className="flex h-screen flex-col sm:hidden">
        <UserList users={gameState.users} variant="waiting" />
        <div className="flex flex-auto flex-col gap-3 p-2 pb-12">
          <Rules />
          <div className="flex justify-center gap-2">
            <InviteButton id={gameState.id} />
            <StartButton
              lowerOpacity={lowerButtonOpacity}
              onClick={handleStart}
              disabled={lastJsonMessage?.type == "gamestart" || !user.host}
              secondsLeft={secondsLeft}
              withCountdown={lastJsonMessage?.type == "gamestart"}
            />
          </div>
        </div>
      </div>
      <div className="relative hidden h-screen sm:block">
        <div
          style={screenStyles}
          className="flex flex-col items-center justify-center gap-6"
        >
          <Logo />
          <div className="flex w-[850px] gap-4">
            <div className="h-[500px]">
              <UserList users={gameState.users} variant="waiting" />
            </div>
            <div className="flex w-full flex-col gap-6">
              <Rules />
              <div className="flex w-full justify-center gap-6">
                <InviteButton id={gameState.id} />
                <StartButton
                  lowerOpacity={lowerButtonOpacity}
                  onClick={handleStart}
                  disabled={lastJsonMessage?.type == "gamestart" || !user.host}
                  secondsLeft={secondsLeft}
                  withCountdown={lastJsonMessage?.type == "gamestart"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const StartButton: React.FC<{
  lowerOpacity?: boolean
  secondsLeft?: number
  withCountdown?: boolean
  disabled?: boolean
  onClick?: () => void
}> = ({ lowerOpacity, secondsLeft, withCountdown, disabled, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-28 rounded-lg bg-red-500 py-4 text-base leading-none text-gray-100 transition-colors enabled:hover:bg-gray-100 enabled:hover:text-red-500 sm:w-32 sm:text-xl",
        lowerOpacity && "opacity-50"
      )}
      disabled={disabled}
    >
      {withCountdown ? secondsLeft : "НАЧАТЬ"}
    </button>
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
        className="rounded-lg border-gray-100 bg-gray-100 px-4 py-4 text-base leading-none text-gray-900 sm:px-5 sm:text-xl"
        onClick={async () => {
          const url = `${window.location.href}?s=${id}`

          try {
            await navigator.clipboard.writeText(url)
          } catch (error) {
            alert(url)
          }

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

export default Waiting
