import React, { useEffect, useState, useRef } from "react"
import clsx from "clsx"
import Image from "next/image"
import { Transition } from "@headlessui/react"
import { useSetAtom } from "jotai"

import useSocket from "../hooks/use-socket"
import useToggle from "../hooks/use-toggle"
import useCountdown from "../hooks/use-countdown"
import useScreenFactor from "../hooks/use-screen-factor"
import useLeavePreventer from "../hooks/use-leave-preventer"
import getScoreLabel from "../functions/get-score-label"
import { gameStateAtom } from "../atoms"

import Logo from "../components/logo"
import BackButton from "../components/back-button"
import UserList from "../components/user-list"
import Rules from "../components/rules"
import SoundOn from "../assets/sound-on.svg"

import type {
  Message as ReceiveMessage,
  User
} from "@evil-cards/server/src/lib/ws/send"
import type { Message as SendMessage } from "@evil-cards/server/src/lib/ws/receive"
import type { GameState } from "../atoms"

const heightPerScore = 29

const Waiting: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  useLeavePreventer()
  const setGameState = useSetAtom(gameStateAtom)
  const containerRef = useRef<HTMLDivElement>(null)
  const screenStyles = useScreenFactor({
    ref: containerRef,
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
    <Transition
      enter="transition-opacity duration-300"
      className="opacity-0"
      enterTo="opacity-100"
      show
      appear
    >
      {gameState.status == "end" && gameState.winners && (
        <Winners winners={gameState.winners} />
      )}
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
          ref={containerRef}
          style={screenStyles}
          className="flex w-[850px] flex-col items-center justify-center gap-6"
        >
          <div className="relative flex w-full items-end justify-between">
            <BackButton
              onClick={() => {
                setGameState(null)
                sendJsonMessage({ type: "leavesession" })
              }}
            />
            <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2">
              <Logo />
            </div>
            <div className="invisible">
              <Logo />
            </div>
            <button>
              <SoundOn />
            </button>
          </div>
          <div className="flex w-full gap-4">
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
    </Transition>
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
        "transition-color h-full w-28 rounded-lg bg-red-500 text-base leading-none text-gray-100 enabled:hover:bg-gray-100 enabled:hover:text-red-500 sm:w-32 sm:text-xl sm:leading-none",
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

    const timeout = setTimeout(toggleCopied, 3000)
    return () => {
      clearTimeout(timeout)
    }
  }, [copied, toggleCopied])

  return (
    <div className="relative">
      <button
        className="rounded-lg border border-gray-100 bg-gray-900 px-4 py-4 text-base leading-none text-gray-100 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:px-5 sm:text-xl sm:leading-none"
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

const Winners: React.FC<{ winners: User[] }> = ({ winners }) => {
  const [show, setShow] = useState(true)
  useEffect(() => {
    const timeout = setTimeout(() => setShow(false), 5000)

    return () => {
      clearTimeout(timeout)
    }
  }, [])

  const containerRef = useRef<HTMLDivElement>(null)
  const screenStyles = useScreenFactor({
    ref: containerRef,
    px: 40,
    py: 40
  })

  const renderUserPlace = (user: User, place: number) => (
    <div className="flex flex-col items-center gap-4">
      <Image
        width={120}
        height={120}
        src={`/avatars/${user.avatarId}.svg`}
        alt=""
      />
      <div
        style={{ minHeight: 100, height: user.score * heightPerScore }}
        className={clsx(
          "flex w-56 flex-col items-center justify-end p-4",
          place == 1 && "bg-gold-300",
          place == 2 && "bg-gold-700",
          place == 3 && "bg-gold-700"
        )}
      >
        <span className="text-2xl font-bold">{user.username}</span>
        <span className="text-lg font-bold">
          {user.score} {getScoreLabel(user.score)}
        </span>
      </div>
    </div>
  )

  if (winners.length < 3) {
    return null
  }

  return (
    <Transition
      className="fixed top-0 left-0 z-50 flex h-screen w-full items-center justify-center bg-gray-900"
      show={show}
      enterFrom="opacity-0"
      enterTo="opacity-100"
      enter="transition-opacity duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      leave="transition-opacity duration-300"
    >
      <div
        ref={containerRef}
        style={screenStyles}
        className="flex flex-col items-center gap-32"
      >
        <div className="text-center text-gray-100">
          <h2 className="text-5xl font-bold leading-normal">ПОЗДРАВЛЯЮ!</h2>
          <p className="text-4xl font-bold">
            {winners[0].username} НАБРАЛ {winners[0].score}{" "}
            {getScoreLabel(winners[0].score)}
          </p>
        </div>
        <div className="flex items-end">
          {renderUserPlace(winners[1], 2)}
          {renderUserPlace(winners[0], 1)}
          {renderUserPlace(winners[2], 3)}
        </div>
      </div>
    </Transition>
  )
}

export default Waiting
