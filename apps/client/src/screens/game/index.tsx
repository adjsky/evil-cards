import React, { useEffect, useCallback } from "react"
import clsx from "clsx"
import { Interweave } from "interweave"
import { useAutoAnimate } from "@formkit/auto-animate/react"

import {
  useSocket,
  useScreenFactor,
  useTimeBar,
  useLeavePreventer
} from "@/lib/hooks"
import { updateSnackbar } from "@/components/snackbar/use"

import PlayerList from "@/components/player-list"
import Card from "@/components/card"
import FadeIn from "@/components/fade-in"
import styles from "./game.module.css"

import type { Message as ReceiveMessage } from "@evil-cards/server/src/lib/ws/send"
import type { Message as SendMessage } from "@evil-cards/server/src/lib/ws/receive"
import type { GameState } from "@/lib/atoms"

const Game: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  useLeavePreventer()
  const { sendJsonMessage } = useSocket<SendMessage, ReceiveMessage>({
    onClose(_, manually) {
      if (manually) {
        return
      }

      updateSnackbar({
        message: "Упс, пропало соединение. Пытаемся его восстановить",
        severity: "error",
        open: true,
        infinite: true
      })
    },
    onOpen() {
      updateSnackbar({ open: false })
    }
  })

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

  return (
    <FadeIn className="mx-auto h-full sm:relative">
      <div
        className="flex h-full flex-col items-center sm:h-auto sm:justify-center sm:gap-3"
        style={screenStyles}
        ref={containerRef}
      >
        <div className="w-full sm:hidden">
          <PlayerList players={gameState.players} variant="game" />
        </div>
        <Board gameState={gameState} onCardClick={onBoardCardClick} />
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
              onCardClick={(text) =>
                sendJsonMessage({ type: "vote", details: { text } })
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
}> = ({ gameState, onCardClick }) => {
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
  )!

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
    </div>
  )
}

const Deck: React.FC<{
  gameState: GameState
  onCardClick?: (text: string) => void
}> = ({ gameState, onCardClick }) => {
  const player = gameState.players.find(
    (player) => player.id == gameState.playerId
  )!
  const availableCardDisabled =
    gameState.status == "choosing" ||
    gameState.status == "choosingwinner" ||
    player.master ||
    player.voted

  return (
    <div
      className={clsx(
        "grid grid-flow-col grid-rows-1 gap-1 overflow-auto sm:grid-flow-row sm:grid-rows-2 sm:gap-2 sm:overflow-visible",
        "auto-cols-[85px] sm:grid-cols-[repeat(5,1fr)]"
      )}
      data-testid="deck"
    >
      {gameState.deck.map((text) => (
        <Card
          key={text}
          text={text}
          onClick={() => onCardClick && onCardClick(text)}
          disabled={availableCardDisabled}
          lowerOpacity={availableCardDisabled}
        />
      ))}
    </div>
  )
}

export default Game
