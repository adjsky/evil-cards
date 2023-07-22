import { Transition } from "@headlessui/react"
import clsx from "clsx"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import Image from "next/image"
import { useRouter } from "next/router"
import React, { useCallback, useEffect, useRef, useState } from "react"

import raise from "@/core/raise"

import { soundsAtom, winnersAtom } from "@/lib/atoms/game"
import { reconnectingSessionAtom, sessionAtom } from "@/lib/atoms/session"
import { copyText, getScoreLabel } from "@/lib/functions"
import {
  useCountdown,
  useLeavePreventer,
  useScreenFactor,
  useSessionSocket,
  useToggle
} from "@/lib/hooks"

import Authors from "@/components/authors"
import BackButton from "@/components/back-button"
import Button from "@/components/button"
import Configuration from "@/components/configuration"
import FadeIn from "@/components/fade-in"
import Logo from "@/components/logo"
import PlayerList from "@/components/player-list"
import Rules from "@/components/rules"
import { updateSnackbar } from "@/components/snackbar/use"

import Author from "@/assets/author.svg"
import Close from "@/assets/close/rounded.svg"
import Gear from "@/assets/gear.svg"
import SoundOff from "@/assets/sound-off.svg"
import SoundOn from "@/assets/sound-on.svg"

import type { Player } from "@evil-cards/server/src/lib/ws/send"

const Waiting: React.FC = () => {
  useLeavePreventer()
  const [sounds, setSounds] = useAtom(soundsAtom)
  const setReconnectingSession = useSetAtom(reconnectingSessionAtom)
  const winners = useAtomValue(winnersAtom)

  const [session, setSession] = useAtom(sessionAtom)

  const { player, configuration, id, players, gameState, playing } =
    session ??
    raise("Trying to render 'Waiting' screen with no session created")

  if (playing) {
    raise(`Trying to render 'Waiting' screen when session is in playing state`)
  }

  const [isStarting, setIsStarting] = useState(false)

  const [visibleMainScreen, setVisibleMainScreen] = useState<
    "configuration" | "rules" | "authors"
  >("rules")

  const screenRef = useRef<HTMLDivElement>(null)
  const leaving = useRef(false)

  const [screenStyles, containerRef] = useScreenFactor({
    px: 40,
    py: 40,
    disableOnMobile: true
  })

  const { start, secondsLeft } = useCountdown()
  const { sendJsonMessage, close, resetUrl } = useSessionSocket({
    onJsonMessage(data) {
      if (data.type == "gamestart") {
        start(3)
      }

      setIsStarting(data.type == "gamestart")
    }
  })

  const onStart = () => {
    sendJsonMessage({ type: "startgame" })
  }

  const onBack = useCallback(() => {
    if (leaving.current) {
      return
    }

    const handleAnimationFinish = () => {
      setSession(null)
      updateSnackbar({ open: false })
      setReconnectingSession(false)

      close()
      resetUrl()
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
  }, [close, resetUrl, setReconnectingSession, setSession])

  const router = useRouter()
  useEffect(() => {
    const handler = (path: string) => {
      if (path == "/") {
        onBack()
      }
    }

    router.events.on("routeChangeStart", handler)

    return () => {
      router.events.off("routeChangeStart", handler)
    }
  }, [router, onBack])

  return (
    <FadeIn className="h-full" ref={screenRef}>
      {gameState.status == "end" && winners && <Winners winners={winners} />}
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
              <PlayerList
                players={players}
                variant="waiting"
                withKick={player?.host && status != "starting"}
                onKick={(player) => {
                  sendJsonMessage({
                    type: "kickplayer",
                    details: {
                      playerId: player.id
                    }
                  })
                }}
              />
            </div>
            <div className="flex min-h-0 w-full flex-1 flex-col gap-3 p-2 pb-12 sm:h-[500px] sm:gap-6 sm:p-0">
              <div className="relative flex min-h-0 w-full flex-auto flex-col rounded-lg border-2 border-gray-200 p-4">
                {visibleMainScreen == "rules" && <Rules />}
                {visibleMainScreen == "authors" && <Authors />}
                {visibleMainScreen == "configuration" && (
                  <Configuration
                    configuration={configuration}
                    host={player?.host}
                    onSave={(configuration) => {
                      sendJsonMessage({
                        type: "updateconfiguration",
                        details: configuration
                      })
                    }}
                  />
                )}
                <button
                  className="absolute top-3 right-3 p-1"
                  onClick={() => {
                    setVisibleMainScreen((currentScreen) =>
                      currentScreen != "rules" ? "rules" : "configuration"
                    )
                  }}
                  data-testid={
                    visibleMainScreen == "configuration"
                      ? "show-rules"
                      : "show-configuration"
                  }
                >
                  {visibleMainScreen != "rules" ? <Close /> : <Gear />}
                </button>
                {visibleMainScreen == "rules" && (
                  <button
                    className="absolute top-3 left-3 p-1"
                    onClick={() => {
                      setVisibleMainScreen("authors")
                    }}
                    data-testid="show-authors"
                  >
                    <Author />
                  </button>
                )}
              </div>
              <div className="flex w-full justify-center gap-2">
                <InviteButton id={id} />
                <StartButton
                  onClick={onStart}
                  disabled={isStarting || !player?.host}
                  secondsLeft={secondsLeft}
                  withCountdown={isStarting}
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
  secondsLeft?: number
  withCountdown?: boolean
  disabled?: boolean
  onClick?: () => void
}> = ({ secondsLeft, withCountdown, disabled, onClick }) => {
  return (
    <Button
      variant="filled"
      onClick={onClick}
      className={clsx("w-28 uppercase sm:w-32", disabled && "opacity-50")}
      disabled={disabled}
      data-testid="start-game"
    >
      {withCountdown ? secondsLeft : "Начать"}
    </Button>
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
      <Button
        variant="outlined"
        className="px-4 py-4 uppercase sm:px-5"
        onClick={async () => {
          const url = `${window.location.origin}?s=${id}`

          if (navigator.canShare && navigator.canShare({ url })) {
            try {
              await navigator.share({ url })
            } catch (error) {
              console.error(error)
            }
          } else {
            await copyText(url)
            !copied && toggleCopied()
          }
        }}
        data-testid="invite-player"
      >
        Пригласить
      </Button>
      <span
        className={clsx(
          "absolute left-1/2 -bottom-[25px] -translate-x-1/2 text-xs font-bold uppercase tracking-wider text-gold-500 transition-opacity",
          copied ? "opacity-100" : "opacity-0"
        )}
      >
        Скопировано
      </span>
    </div>
  )
}

const HEIGHT_PER_SCORE = 29

const Winners: React.FC<{ winners: [Player, Player, Player] }> = ({
  winners
}) => {
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

  const renderUserPlace = (player: Player, place: number) => (
    <div className="flex flex-col items-center gap-4">
      <Image
        width={120}
        height={120}
        src={`/avatars/${player.avatarId}.svg`}
        alt=""
        className="overflow-hidden rounded-full bg-gray-200"
      />
      <div
        style={{ minHeight: 100, height: player.score * HEIGHT_PER_SCORE }}
        className={clsx(
          "flex w-56 flex-col items-center justify-end p-4",
          place == 1 && "bg-gold-300",
          place == 2 && "bg-gold-700",
          place == 3 && "bg-gold-700"
        )}
      >
        <span className="text-2xl font-bold">{player.nickname}</span>
        <span className="text-lg font-bold">
          {player.score} {getScoreLabel(player.score)}
        </span>
      </div>
    </div>
  )

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
            {winners[0].nickname} НАБРАЛ {winners[0].score}{" "}
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
