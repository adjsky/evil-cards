import React, { useEffect, useCallback, useState } from "react"
import clsx from "clsx"
import { Interweave } from "interweave"
import { useAutoAnimate } from "@formkit/auto-animate/react"

import {
  useSocket,
  useScreenFactor,
  useTimeBar,
  useLeavePreventer
} from "@/lib/hooks"

import PlayerList from "@/components/player-list"
import Card from "@/components/card"
import FadeIn from "@/components/fade-in"
import styles from "./game.module.css"
import DiscardIcon from "../../assets/discard.svg"
import ExclamationTriangleIcon from "../../assets/exclamation-triangle.svg"
import Modal from "@/components/modal"

import type { Message as ReceiveMessage } from "@evil-cards/server/src/lib/ws/send"
import type { Message as SendMessage } from "@evil-cards/server/src/lib/ws/receive"
import type { GameState } from "@/lib/atoms"

const Game: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  useLeavePreventer()
  const { sendJsonMessage } = useSocket<SendMessage, ReceiveMessage>()

  const [screenStyles, containerRef] = useScreenFactor({
    px: 40,
    py: 40,
    disableOnMobile: true
  })
  const timeBarStyles = useTimeBar(
    gameState.configuration.votingDurationSeconds,
    gameState.votingEndsAt
  )

  const onBoardCardClick = (playerId: string) => {
    if (gameState.status == "choosing") {
      sendJsonMessage({ type: "choose", details: { playerId } })
    } else {
      sendJsonMessage({ type: "choosewinner", details: { playerId } })
    }
  }

  const onDiscard = () => {
    sendJsonMessage({ type: "discardcards" })
  }

  return (
    <FadeIn className="mx-auto h-full sm:relative sm:flex sm:items-center sm:justify-center">
      <div
        className="flex h-full flex-col items-center sm:h-auto sm:justify-center sm:gap-3"
        style={screenStyles}
        ref={containerRef}
      >
        <div className="w-full sm:hidden">
          <PlayerList players={gameState.players} variant="game" />
        </div>
        <Board
          gameState={gameState}
          onCardClick={onBoardCardClick}
          onDiscard={onDiscard}
        />
        <div className="flex w-full gap-4 px-2 pb-2 sm:px-0 sm:pb-0">
          <div className="hidden sm:block">
            <PlayerList players={gameState.players} variant="game" />
          </div>
          <div className="flex w-full flex-col gap-2 sm:gap-3">
            <div className="relative h-[10px] w-full rounded-lg bg-gray-200">
              <div
                className="absolute left-0 top-0 h-full rounded-lg bg-red-500"
                style={timeBarStyles}
                data-testid="timebar"
              />
            </div>
            <Deck
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

const Board: React.FC<{
  gameState: GameState
  onCardClick?: (userId: string) => void
  onDiscard?: () => void
}> = ({ gameState, onCardClick, onDiscard }) => {
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

  const player = gameState.players.find(
    (player) => player.id == gameState.playerId
  )

  return (
    <div className="relative flex w-full flex-auto items-center justify-center">
      <div
        className={clsx(
          "flex items-center justify-center",
          gameState.votes.length > 0 && "sm:justify-between",
          styles["board"]
        )}
        style={boardStyles}
        ref={boardRefCallback}
      >
        <div
          className={clsx("bg-red-500", styles["red-card"])}
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
              ({ text, playerId, visible, winner }, index) => (
                <div
                  className={clsx(
                    styles["voted-card"],
                    styles[`card-${index + 1}`]
                  )}
                  key={text}
                >
                  <Card
                    text={visible ? text : undefined}
                    author={
                      winner
                        ? gameState.players.find(
                            (player) => player.id == playerId
                          )?.nickname
                        : undefined
                    }
                    disabled={
                      !player?.master ||
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
      <Discard score={player?.score ?? 0} onDiscard={onDiscard} />
    </div>
  )
}

const Deck: React.FC<{
  gameState: GameState
  onCardClick?: (cardId: string) => void
}> = ({ gameState, onCardClick }) => {
  const player = gameState.players.find(
    (player) => player.id == gameState.playerId
  )
  const availableCardDisabled =
    gameState.status == "choosing" ||
    gameState.status == "choosingwinner" ||
    player?.master ||
    player?.voted

  return (
    <div
      className={clsx(
        "grid grid-flow-col grid-rows-1 gap-1 overflow-auto sm:grid-flow-row sm:grid-rows-2 sm:gap-2 sm:overflow-visible",
        "auto-cols-[85px] sm:grid-cols-[repeat(5,1fr)]"
      )}
      data-testid="deck"
    >
      {gameState.deck.map((card) => (
        <Card
          key={card.id}
          text={card.text}
          onClick={() => onCardClick && onCardClick(card.id)}
          disabled={availableCardDisabled}
          lowerOpacity={availableCardDisabled}
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
        className="absolute bottom-2 right-2 transition-transform duration-300 hover:rotate-180 sm:bottom-0 sm:right-0"
        onClick={() => setOpen(true)}
      >
        <DiscardIcon />
      </button>
      <Modal
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        className="w-full max-w-sm transform overflow-hidden rounded-xl bg-gray-100 p-6 text-gray-900 text-left align-middle shadow-lg transition-all"
      >
        <Modal.Title
          as="h3"
          className="text-center text-xl font-bold"
        >
          ЖЕЛАЕТЕ СБРОСИТЬ КАРТЫ?
        </Modal.Title>

        <ExclamationTriangleIcon className="mx-auto my-3 h-24 w-24 fill-red-500/50" />

        <Modal.Description className="text-center font-medium">
          Взамен на одно очко вы получите десять новых карт.
        </Modal.Description>

        <div className="mt-4 flex w-full gap-2">
          <button
            className="flex-1 rounded-lg border border-gray-900 py-3 leading-none transition-colors hover:bg-gray-900 hover:text-gray-100"
            onClick={() => setOpen(false)}
          >
            НЕТ
          </button>
          <button
            className="flex-1 rounded-lg border border-red-500 bg-red-500 leading-none text-gray-100 transition-colors enabled:hover:bg-gray-100 enabled:hover:text-red-500 disabled:opacity-50"
            onClick={() => {
              setOpen(false)
              onDiscard && onDiscard()
            }}
            disabled={score == 0}
          >
            ДА
          </button>
        </div>
      </Modal>
    </>
  )
}

export default Game
