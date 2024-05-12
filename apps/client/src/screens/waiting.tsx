import { Transition } from "@headlessui/react"
import { useAtom, useAtomValue } from "jotai"
import React, { useEffect, useMemo, useRef, useState } from "react"

import raise from "@/core/raise"

import { winnersAtom } from "@/lib/atoms/game"
import { sessionAtom } from "@/lib/atoms/session"
import cn from "@/lib/functions/cn"
import copyText from "@/lib/functions/copy-text"
import getScoreLabel from "@/lib/functions/get-score-label"
import useCloseTabPreventer from "@/lib/hooks/use-close-tab-preventer"
import useCountdown from "@/lib/hooks/use-countdown"
import useDebounce from "@/lib/hooks/use-debounce"
import useLeaveSession from "@/lib/hooks/use-leave-session"
import useScreenFactor from "@/lib/hooks/use-screen-factor"
import useSessionSocket from "@/lib/hooks/use-session-socket"
import useToggle from "@/lib/hooks/use-toggle"

import Authors from "@/components/authors"
import BackButton from "@/components/back-button"
import Button from "@/components/button"
import Chat from "@/components/chat"
import Configuration from "@/components/configuration"
import DonationDetails from "@/components/donation-details"
import FadeIn from "@/components/fade-in"
import Logo from "@/components/logo"
import PlayerList from "@/components/player-list"
import Rules from "@/components/rules"
import { notify } from "@/components/snackbar"
import SoundsButton from "@/components/sounds-button"

import { ReactComponent as Author } from "@/assets/author.svg"
import { ReactComponent as ChatIcon } from "@/assets/chat.svg"
import { ReactComponent as Close } from "@/assets/close/rounded.svg"
import { ReactComponent as Donation } from "@/assets/donation.svg"
import { ReactComponent as Gear } from "@/assets/gear.svg"

import type { Player } from "@evil-cards/server/src/ws/send"

const Waiting: React.FC = () => {
  useCloseTabPreventer()

  const [session, setSession] = useAtom(sessionAtom)
  const { player, configuration, id, players, gameState, playing, chat } =
    session ??
    raise("Trying to render 'Waiting' screen with no session created")

  if (playing) {
    raise(`Trying to render 'Waiting' screen when session is in playing state`)
  }

  const hasUnreadMessages = useMemo(
    () => chat.some((message) => !message.read),
    [chat]
  )
  const debouncedHasUnreadMessages = useDebounce(hasUnreadMessages, 100)

  const winners = useAtomValue(winnersAtom)

  const [isStarting, setIsStarting] = useState(false)
  const [visibleMainScreen, setVisibleMainScreen] = useState<
    "configuration" | "rules" | "authors" | "chat" | "donation"
  >("rules")

  const screenRef = useRef<HTMLDivElement>(null)
  const onDeckUploadResultRef = useRef<(ok: boolean) => void>()

  const [screenStyles, containerRef] = useScreenFactor({
    px: 40,
    py: 40,
    disableOnMobile: true
  })

  const { start, secondsLeft } = useCountdown()
  const { sendJsonMessage, closeSocket, resetSocketUrl } = useSessionSocket({
    onJsonMessage(data) {
      switch (data.type) {
        case "customdeckuploadresult":
          if (data.details.ok) {
            notify({
              infinite: false,
              message: "Набор карт успешно загружен.",
              severity: "information"
            })
          } else {
            notify({
              infinite: false,
              message:
                "Не удалось загрузить набор карт. Детали ошибки можно посмотреть в консоли.",
              severity: "error"
            })

            console.error(data.details.message)
          }

          onDeckUploadResultRef.current?.(data.details.ok)

          break

        case "gamestart":
          start(3)
          setIsStarting(true)

          break
      }
    }
  })

  const { leaveSession } = useLeaveSession()

  const onStart = () => {
    sendJsonMessage({ type: "startgame" })
  }

  const onChat = (message: string) => {
    sendJsonMessage({
      type: "chat",
      details: {
        message
      }
    })
  }

  const onMessageRead = (id: string) => {
    setSession((prev) => {
      if (!prev) {
        return prev
      }

      return {
        ...prev,
        chat: prev.chat.map((message) => {
          if (message.id != id) {
            return message
          }

          return { ...message, read: true }
        })
      }
    })
  }

  const onBack = () => {
    if (!screenRef.current) {
      raise("Waiting screen is not mounted")
    }

    leaveSession({
      screen: screenRef.current,
      closeSocket,
      resetSocketUrl
    })
  }

  useEffect(() => {
    window.addEventListener("popstate", onBack)

    return () => {
      window.removeEventListener("popstate", onBack)
    }
  })

  return (
    <FadeIn className="h-full" ref={screenRef}>
      {gameState.status == "end" && winners && <Winners winners={winners} />}
      <div className="relative h-full">
        <div
          ref={containerRef}
          style={screenStyles}
          className="flex h-full flex-col items-center justify-center gap-6 sm:h-auto sm:w-[1140px]"
        >
          <div className="relative hidden w-full items-end justify-between sm:flex">
            <BackButton onClick={onBack} />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <Logo />
            </div>
            <div className="invisible">
              <Logo />
            </div>
            <SoundsButton />
          </div>
          <div className="flex h-full w-full flex-col sm:h-[500px] sm:flex-row sm:gap-4">
            <PlayerList
              className="ultra-short:hidden"
              players={players}
              variant="waiting"
              withKick={player.host}
              onKick={(player) => {
                sendJsonMessage({
                  type: "kickplayer",
                  details: {
                    playerId: player.id
                  }
                })
              }}
            />
            <div className="short:p-2 flex min-h-0 w-full flex-1 flex-col gap-3 p-2 pb-12 sm:gap-6 sm:p-0">
              <div className="relative flex min-h-0 w-full flex-auto flex-col rounded-lg border-2 border-gray-200 p-4">
                {visibleMainScreen == "rules" && (
                  <MainScreen title="Правила">
                    <Rules />
                  </MainScreen>
                )}
                {visibleMainScreen == "authors" && (
                  <MainScreen title="Авторы">
                    <Authors />
                  </MainScreen>
                )}
                {visibleMainScreen == "donation" && (
                  <MainScreen title="Реквизиты">
                    <DonationDetails />
                  </MainScreen>
                )}
                {visibleMainScreen == "chat" && (
                  <MainScreen title="Чат комнаты" className="min-h-0">
                    <Chat
                      chat={chat}
                      onChat={onChat}
                      onMessageRead={onMessageRead}
                    />
                  </MainScreen>
                )}
                {visibleMainScreen == "configuration" && (
                  <MainScreen title="Настройки" className="min-h-0">
                    <Configuration
                      configuration={configuration}
                      host={player?.host}
                      onSave={(configuration) => {
                        sendJsonMessage({
                          type: "updateconfiguration",
                          details: configuration
                        })
                      }}
                      onDeckUpload={(base64, onFinish) => {
                        sendJsonMessage({
                          type: "uploaddeck",
                          details: {
                            base64
                          }
                        })

                        onDeckUploadResultRef.current = onFinish
                      }}
                    />
                  </MainScreen>
                )}

                <button
                  className="absolute right-3 top-3 p-1"
                  onClick={() => {
                    setVisibleMainScreen((currentScreen) =>
                      currentScreen != "rules" ? "rules" : "configuration"
                    )
                  }}
                  aria-label={
                    visibleMainScreen == "configuration"
                      ? "Показать правила"
                      : "Показать настройки"
                  }
                  data-testid={
                    visibleMainScreen == "configuration"
                      ? "show-rules"
                      : "show-configuration"
                  }
                >
                  {visibleMainScreen != "rules" ? <Close /> : <Gear />}
                </button>

                {visibleMainScreen == "rules" && (
                  <>
                    <button
                      className="absolute bottom-3 right-3 p-1 sm:bottom-auto sm:left-3 sm:right-auto sm:top-3"
                      onClick={() => {
                        setVisibleMainScreen("authors")
                      }}
                      aria-label="Показать авторов"
                      data-testid="show-authors"
                    >
                      <Author />
                    </button>

                    <button
                      className="absolute bottom-3 left-3 p-1"
                      onClick={() => {
                        setVisibleMainScreen("donation")
                      }}
                      aria-label="Показать реквизиты для пожертвований"
                      data-testid="show-donation"
                    >
                      <Donation />
                    </button>

                    <button
                      className="absolute left-3 top-3 p-1 sm:hidden"
                      onClick={() => {
                        setVisibleMainScreen("chat")
                      }}
                      aria-label="Показать чат"
                      data-testid="show-chat"
                    >
                      <ChatIcon />
                      {debouncedHasUnreadMessages && (
                        <span className="absolute right-0 top-0.5 h-3 w-3 rounded-full bg-red-500" />
                      )}
                    </button>
                  </>
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
            <div className="hidden w-[300px] rounded-lg border-2 border-gray-200 p-3 sm:flex">
              <MainScreen title="Чат" className="min-h-0">
                <Chat
                  chat={chat}
                  onChat={onChat}
                  onMessageRead={onMessageRead}
                />
              </MainScreen>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  )
}

const MainScreen: React.FC<
  React.PropsWithChildren<{ title: string; className?: string }>
> = ({ title, className, children }) => {
  return (
    <div
      className={cn(
        "flex w-full flex-auto flex-col items-center gap-4",
        className
      )}
    >
      <h2 className="text-center text-xl font-bold uppercase text-gray-100 sm:text-3xl">
        {title}
      </h2>
      {children}
    </div>
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
      className={cn("w-28 uppercase sm:w-32", disabled && "opacity-50")}
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
        className={cn(
          "text-gold-500 absolute -bottom-[25px] left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-wider transition-opacity",
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
      <img
        width={120}
        height={120}
        src={`/avatars/${player.avatarId}.svg`}
        alt={`Аватар ${player.avatarId}`}
        loading="lazy"
        decoding="async"
      />
      <div
        style={{ minHeight: 100, height: player.score * HEIGHT_PER_SCORE }}
        className={cn(
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
      className="fixed left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-gray-900"
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
