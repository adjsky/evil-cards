import { useAutoAnimate } from "@formkit/auto-animate/react"
import { Interweave } from "interweave"
import { useAtom, useSetAtom } from "jotai"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

import raise from "@/core/raise"

import { winnersAtom } from "@/lib/atoms/game"
import { sessionAtom } from "@/lib/atoms/session"
import cn from "@/lib/functions/cn"
import useCloseTabPreventer from "@/lib/hooks/use-close-tab-preventer"
import useDebounce from "@/lib/hooks/use-debounce"
import useScreenFactor from "@/lib/hooks/use-screen-factor"
import useSessionSocket from "@/lib/hooks/use-session-socket"
import useTimeBar from "@/lib/hooks/use-time-bar"

import Button from "@/components/button"
import Card from "@/components/card"
import BaseChat from "@/components/chat"
import FadeIn from "@/components/fade-in"
import Modal from "@/components/modal"
import PlayerList from "@/components/player-list"
import { notify } from "@/components/snackbar"
import SoundsButton from "@/components/sounds-button"

import { ReactComponent as ChatIcon } from "../assets/chat.svg"
import { ReactComponent as CloseIcon } from "../assets/close/rounded.svg"
import { ReactComponent as DiscardIcon } from "../assets/discard.svg"
import { ReactComponent as ExclamationTriangleIcon } from "../assets/exclamation-triangle.svg"
import styles from "./game.module.css"

import type { PlayingGameState } from "@/lib/atoms/session"
import type { Player } from "@evil-cards/server/src/ws/send"

const Game: React.FC = () => {
  useCloseTabPreventer()

  const screenRef = useRef<HTMLDivElement>(null)

  const { sendJsonMessage } = useSessionSocket({
    onJsonMessage({ type, details }) {
      if (type == "gameend") {
        const { players } = details.changedState

        if (players.length < 3) {
          notify({
            infinite: false,
            message:
              "Игра прекращена, поскольку в комнате осталось меньше 3 игроков.",
            severity: "information"
          })

          return
        }

        const sortedByScore = [...players].sort((a, b) => b.score - a.score)

        setWinners([sortedByScore[0], sortedByScore[1], sortedByScore[2]])
      }
    }
  })

  const setWinners = useSetAtom(winnersAtom)
  const [session, setSession] = useAtom(sessionAtom)

  const { player, configuration, players, gameState, playing, chat } =
    session ?? raise("Trying to render 'Game' screen with no session created")

  if (!playing) {
    raise(`Trying to render 'Game' screen when session is not in playing state`)
  }

  const [screenStyles, containerRef] = useScreenFactor({
    px: 40,
    py: 40,
    disableOnMobile: true
  })
  const timeBarStyles = useTimeBar(
    configuration.votingDurationSeconds,
    gameState.votingEndsAt
  )

  const onBoardCardClick = (playerId: string) => {
    if (gameState.status == "choosing") {
      sendJsonMessage({ type: "choose", details: { playerId } })
    } else {
      sendJsonMessage({ type: "choosewinner", details: { playerId } })
    }
  }

  return (
    <FadeIn
      className="mx-auto h-full sm:relative sm:flex sm:items-center sm:justify-center"
      ref={screenRef}
    >
      <div
        className="flex h-full flex-col items-center sm:h-auto sm:justify-center sm:gap-3"
        style={screenStyles}
        ref={containerRef}
      >
        <div className="w-full sm:hidden">
          <PlayerList
            testIdPrefix="mobile"
            players={players}
            variant="game"
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
        </div>
        <Board
          player={player}
          gameState={gameState}
          players={players}
          chat={chat}
          onCardClick={onBoardCardClick}
          onDiscard={() => sendJsonMessage({ type: "discardcards" })}
          onChat={(message) =>
            sendJsonMessage({ type: "chat", details: { message } })
          }
          onMessageRead={(id) => {
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
          }}
        />
        <div className="flex w-full gap-4 px-2 pb-2 sm:px-0 sm:pb-0">
          <div className="hidden max-h-[420px] sm:block">
            <PlayerList
              testIdPrefix="desktop"
              players={players}
              variant="game"
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
          </div>
          <div className="flex w-full flex-col gap-2 sm:gap-3">
            <div className="relative h-[10px] w-full rounded-lg bg-gray-200">
              <div
                className="absolute left-0 top-0 h-full rounded-lg bg-red-500"
                style={timeBarStyles}
                data-testid="timebar"
              />
            </div>
            <Hand
              player={player}
              gameState={gameState}
              onCardClick={(cardId) =>
                sendJsonMessage({ type: "vote", details: { cardId } })
              }
            />
          </div>
        </div>
      </div>
    </FadeIn>
  )
}

const Board: React.FC<
  {
    player: Player
    players: Player[]
    gameState: PlayingGameState
    onCardClick?: (userId: string) => void
    onDiscard?: () => void
  } & Parameters<typeof BaseChat>[0]
> = ({
  player,
  players,
  gameState,
  chat,
  onCardClick,
  onDiscard,
  onChat,
  onMessageRead
}) => {
  const [boardRefAnimate, enable] = useAutoAnimate(
    (element, action, oldCoords, newCoords) => {
      let keyframes: Keyframe[] = []

      if (action == "remain") {
        const deltaX = (oldCoords?.left ?? 0) - (newCoords?.left ?? 0)

        const start = { transform: `translateX(${deltaX}px)` }
        const end = { transform: `translateX(0)` }

        keyframes = [start, end]
      }

      if (action == "add") {
        keyframes = [
          { opacity: 0 },
          { opacity: 0, offset: 0.5 },
          { opacity: 1 }
        ]
      }

      if (action == "remove") {
        keyframes = [{ opacity: 0 }]
      }

      return new KeyframeEffect(element, keyframes, {
        duration: action == "remove" ? 0 : action == "add" ? 500 : 300,
        easing: "linear"
      })
    }
  )
  const [boardStyles, boardRefScreenFactor] = useScreenFactor({
    px: 0,
    py: 0,
    stopAt: 639,
    reduceScreenSizeBy: {
      y: 235
    }
  })
  const boardRefCallback = useCallback(
    (node: HTMLElement | null) => {
      boardRefAnimate(node)
      boardRefScreenFactor(node)
    },
    [boardRefAnimate, boardRefScreenFactor]
  )

  useEffect(() => {
    const callback = () => {
      enable(window.innerWidth >= 640)
    }

    callback()

    window.addEventListener("resize", callback)
    return () => {
      window.removeEventListener("resize", callback)
    }
  }, [enable])

  return (
    <div className="relative flex w-full flex-auto items-center justify-center">
      <div
        className={cn(
          "flex items-center justify-center",
          gameState.votes.length > 0 && "sm:justify-between",
          styles["board"]
        )}
        style={boardStyles}
        ref={boardRefCallback}
      >
        <div
          className={cn("bg-red-500", styles["red-card"])}
          data-testid="red-card"
        >
          <Interweave
            content={gameState.redCard}
            className="whitespace-pre-line break-words text-[0.625rem] font-medium text-gray-100 sm:text-sm sm:leading-normal"
          />
        </div>
        {gameState.votes.length > 0 && (
          <div
            className="sm:grid sm:w-auto sm:grid-cols-5 sm:grid-rows-2 sm:gap-2"
            data-testid="votes"
          >
            {gameState.votes.map(
              ({ card, playerId, visible, winner }, index) => (
                <div
                  className={cn(
                    styles["voted-card"],
                    styles[`card-${index + 1}`]
                  )}
                  key={card.id}
                >
                  <Card
                    testId="voted-card"
                    text={visible ? card.text : undefined}
                    author={
                      winner
                        ? players.find((player) => player.id == playerId)
                            ?.nickname
                        : undefined
                    }
                    disabled={
                      !player.master ||
                      (visible && gameState.status != "choosingwinner") ||
                      (!visible && gameState.status != "choosing")
                    }
                    onClick={() => {
                      onCardClick && onCardClick(playerId)
                    }}
                    flipable
                  />
                </div>
              )
            )}
          </div>
        )}
      </div>
      <SoundsButton
        width={32}
        height={32}
        className="absolute right-2 top-2 sm:bottom-0 sm:left-[163px] sm:right-auto sm:top-auto"
      />
      <Discard score={player?.score ?? 0} onDiscard={onDiscard} />
      <Chat chat={chat} onChat={onChat} onMessageRead={onMessageRead} />
    </div>
  )
}

const Hand: React.FC<{
  gameState: PlayingGameState
  player: Player
  onCardClick?: (cardId: string) => void
}> = ({ gameState, player, onCardClick }) => {
  const disabled =
    gameState.status == "choosing" ||
    gameState.status == "choosingwinner" ||
    player.master ||
    player.voted

  return (
    <div
      className={cn(
        "grid touch-pan-x grid-flow-col grid-rows-1 gap-1 overflow-auto sm:grid-flow-row sm:grid-rows-2 sm:gap-2 sm:overflow-visible",
        "auto-cols-[85px] sm:grid-cols-[repeat(5,1fr)]"
      )}
    >
      {gameState.hand.map((card) => (
        <Card
          testId="hand-card"
          key={card.id}
          text={card.text}
          onClick={() => onCardClick && onCardClick(card.id)}
          disabled={disabled}
          lowerOpacity={disabled}
        />
      ))}
    </div>
  )
}

const Discard: React.FC<{ score: number; onDiscard?: () => void }> = ({
  score,
  onDiscard
}) => {
  const [isOpen, setOpen] = useState(false)

  return (
    <>
      <button
        data-testid="discard-hand"
        className="absolute bottom-2 right-2 transition-transform duration-300 hover:-rotate-180 sm:bottom-0 sm:right-0"
        onClick={() => setOpen(true)}
      >
        <DiscardIcon />
      </button>
      <Modal
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        className="w-full max-w-sm rounded-xl bg-gray-900 p-6 text-gray-100 shadow-lg"
      >
        <Modal.Title
          as="h3"
          className="text-center text-xl font-bold uppercase"
        >
          Желаете сбросить карты?
        </Modal.Title>

        <ExclamationTriangleIcon className="mx-auto my-3 h-24 w-24 fill-red-500" />

        <Modal.Description className="text-center font-medium">
          Взамен на одно очко вы получите десять новых карт.
        </Modal.Description>

        <div className="mt-4 flex w-full gap-2">
          <Button
            variant="outlined"
            className="flex-1 py-3 uppercase"
            onClick={() => setOpen(false)}
            data-testid="abort-discard-hand"
          >
            Нет
          </Button>
          <Button
            variant="filledBorder"
            className="flex-1 uppercase"
            onClick={() => {
              setOpen(false)
              onDiscard && onDiscard()
            }}
            disabled={score == 0}
            data-testid="confirm-discard-hand"
          >
            Да
          </Button>
        </div>
      </Modal>
    </>
  )
}

const Chat: React.FC<Parameters<typeof BaseChat>[0]> = ({
  chat,
  onChat,
  onMessageRead
}) => {
  const [isOpen, setOpen] = useState(false)

  const hasUnreadMessages = useMemo(
    () => chat.some((message) => !message.read),
    [chat]
  )
  const debouncedHasUnreadMessages = useDebounce(hasUnreadMessages, 100)

  return (
    <>
      <button
        className="absolute bottom-2 left-2 sm:bottom-0 sm:left-0"
        data-testid="open-chat"
        onClick={() => setOpen(true)}
      >
        <ChatIcon />
        {debouncedHasUnreadMessages && (
          <span className="absolute -right-1 -top-0.5 h-3 w-3 rounded-full bg-red-500" />
        )}
      </button>
      <Modal
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        className="relative flex h-full max-h-[450px] w-full max-w-sm flex-col rounded-xl bg-gray-900 p-6 text-gray-100 shadow-lg"
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 p-1"
          data-testid="close-chat"
        >
          <CloseIcon className="h-6 w-6" />
        </button>

        <Modal.Title
          as="h3"
          className="text-center text-xl font-bold uppercase leading-none"
        >
          Чат комнаты
        </Modal.Title>

        <hr className="border-none py-1.5" />

        <div className="min-h-0 flex-1">
          <BaseChat chat={chat} onChat={onChat} onMessageRead={onMessageRead} />
        </div>
      </Modal>
    </>
  )
}

export default Game
