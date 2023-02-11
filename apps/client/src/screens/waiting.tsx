import React, { useEffect, useState, useRef, useCallback } from "react"
import clsx from "clsx"
import Image from "next/image"
import { Transition } from "@headlessui/react"
import { useAtom } from "jotai"
import { useRouter } from "next/router"

import {
  useSocket,
  useToggle,
  useCountdown,
  useScreenFactor,
  useLeavePreventer
} from "@/lib/hooks"
import { getScoreLabel, copyText } from "@/lib/functions"
import { soundsAtom } from "@/lib/atoms"

import FadeIn from "@/components/fade-in"
import Logo from "@/components/logo"
import BackButton from "@/components/back-button"
import UserList from "@/components/user-list"
import Rules from "@/components/rules"
import Configuration from "@/components/configuration"
import SoundOn from "@/assets/sound-on.svg"
import SoundOff from "@/assets/sound-off.svg"
import Gear from "@/assets/gear.svg"
import Close from "@/assets/configuration-close.svg"

import type {
  Message as ReceiveMessage,
  User
} from "@evil-cards/server/src/lib/ws/send"
import type { Message as SendMessage } from "@evil-cards/server/src/lib/ws/receive"
import type { GameState } from "@/lib/atoms"

const Waiting: React.FC<{
  gameState: GameState
  onGameStateUpdate?: (gameState: GameState | null) => void
}> = ({ gameState, onGameStateUpdate }) => {
  useLeavePreventer()
  const [configurationVisible, toggleConfiguration] = useToggle()
  const [sounds, setSounds] = useAtom(soundsAtom)

  const screenRef = useRef<HTMLDivElement>(null)
  const leaving = useRef(false)

  const [screenStyles, containerRef] = useScreenFactor({
    px: 40,
    py: 40,
    disableOnMobile: true
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

  const user = gameState.users.find((user) => user.id == gameState.userId)!
  const lowerButtonOpacity =
    !user.host && (gameState.status == "waiting" || gameState.status == "end")

  const onStart = () => {
    sendJsonMessage({ type: "startgame" })
  }

  const onBack = useCallback(() => {
    if (leaving.current) {
      return
    }

    const handleAnimationFinish = () => {
      onGameStateUpdate && onGameStateUpdate(null)
      sendJsonMessage({ type: "leavesession" })
    }

    leaving.current = true

    const animation = screenRef.current?.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      {
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        duration: 100,
        fill: "forwards"
      }
    )

    if (animation) {
      animation.onfinish = handleAnimationFinish
    } else {
      handleAnimationFinish()
    }
  }, [onGameStateUpdate, sendJsonMessage])

  const router = useRouter()
  useEffect(() => {
    router.beforePopState(({ as }) => {
      if (as !== router.asPath) {
        onBack()
      }

      return true
    })

    return () => {
      router.beforePopState(() => true)
    }
  }, [router, onBack])

  return (
    <FadeIn className="h-full" ref={screenRef}>
      {gameState.status == "end" && gameState.winners && (
        <Winners winners={gameState.winners} />
      )}
      <div className="relative h-full">
        <div
          ref={containerRef}
          style={screenStyles}
          className="flex h-full flex-col items-center justify-center gap-6 sm:h-auto sm:w-[850px]"
        >
          <div className="relative hidden w-full items-end justify-between sm:flex">
            <BackButton onClick={onBack} />
            <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2">
              <Logo />
            </div>
            <div className="invisible">
              <Logo />
            </div>
            <button
              onClick={() => setSounds(!sounds)}
              data-testid={sounds ? "disable-sounds" : "enable-sounds"}
            >
              {sounds ? <SoundOn /> : <SoundOff />}
            </button>
          </div>
          <div className="flex h-full w-full flex-col sm:h-full sm:flex-row sm:gap-4">
            <div className="sm:h-[500px]">
              <UserList users={gameState.users} variant="waiting" />
            </div>
            <div className="flex w-full flex-1 flex-col gap-3 p-2 pb-12 sm:gap-6 sm:p-0">
              <div className="relative flex w-full flex-auto flex-col rounded-lg border-2 border-gray-200 p-4">
                {!configurationVisible && <Rules />}
                {configurationVisible && (
                  <Configuration
                    configuration={gameState.configuration}
                    host={user.host}
                    onSave={(configuration) => {
                      sendJsonMessage({
                        type: "updateconfiguration",
                        details: configuration
                      })
                      toggleConfiguration()
                    }}
                  />
                )}
                <button
                  className="absolute top-3 right-3 p-1"
                  onClick={toggleConfiguration}
                  data-testid={
                    configurationVisible
                      ? "close-configuration"
                      : "show-configuration"
                  }
                >
                  {configurationVisible ? <Close /> : <Gear />}
                </button>
              </div>
              <div className="flex w-full justify-center gap-2 sm:gap-6">
                <InviteButton id={gameState.id} />
                <StartButton
                  lowerOpacity={lowerButtonOpacity}
                  onClick={onStart}
                  disabled={lastJsonMessage?.type == "gamestart" || !user.host}
                  secondsLeft={secondsLeft}
                  withCountdown={lastJsonMessage?.type == "gamestart"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
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
        "w-28 rounded-lg bg-red-500 text-base leading-none text-gray-100 transition-colors enabled:hover:bg-gray-100 enabled:hover:text-red-500 sm:w-32 sm:text-xl sm:leading-none",
        lowerOpacity && "opacity-50"
      )}
      disabled={disabled}
      data-testid="start-game"
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
          const url = `${window.location.origin}?s=${id}`

          if (navigator.canShare && navigator.canShare({ url })) {
            navigator.share({ url })
          } else {
            await copyText(url)
            !copied && toggleCopied()
          }
        }}
        data-testid="invite-player"
      >
        ПРИГЛАСИТЬ
      </button>
      <span
        className={clsx(
          "absolute left-1/2 -bottom-[25px] -translate-x-1/2 text-xs font-bold tracking-wider text-gold-500 transition-opacity",
          copied ? "opacity-100" : "opacity-0"
        )}
      >
        СКОПИРОВАНО
      </span>
    </div>
  )
}

const HEIGHT_PER_SCORE = 29

const Winners: React.FC<{ winners: User[] }> = ({ winners }) => {
  const [show, setShow] = useState(true)
  useEffect(() => {
    const timeout = setTimeout(() => setShow(false), 5000)

    return () => {
      clearTimeout(timeout)
    }
  }, [])

  const [screenStyles, containerRef] = useScreenFactor({
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
        style={{ minHeight: 100, height: user.score * HEIGHT_PER_SCORE }}
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
      className="fixed top-0 left-0 z-50 flex h-full w-full items-center justify-center bg-gray-900"
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
        <div className="flex items-end" data-testid="winners">
          {renderUserPlace(winners[1], 2)}
          {renderUserPlace(winners[0], 1)}
          {renderUserPlace(winners[2], 3)}
        </div>
      </div>
    </Transition>
  )
}

export default Waiting
