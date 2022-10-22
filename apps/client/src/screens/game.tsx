import React from "react"
import { useAtom } from "jotai"
import clsx from "clsx"
import { Interweave } from "interweave"
import typo from "ru-typo"

import { gameStateAtom } from "../atoms"
import useSocket from "../hooks/use-socket"
import useScreenFactor from "../hooks/use-screen-factor"

import UserList from "../components/user-list"
import { Cat } from "../components/icons"

import type { Message as ReceiveMessage } from "@kado/schemas/dist/client/receive"
import type { Message as SendMessage } from "@kado/schemas/dist/client/send"

const Game: React.FC = () => {
  const [gameState] = useAtom(gameStateAtom)
  const { sendJsonMessage } = useSocket<SendMessage, ReceiveMessage>()

  const screenStyles = useScreenFactor({
    width: 850,
    height: 718,
    px: 40,
    py: 40
  })

  if (!gameState) {
    return null
  }
  const user = gameState.session.users.find(
    (user) => user.id == gameState.userId
  )
  if (!user) {
    return null
  }
  const availableCardDisabled =
    gameState.session.state == "choosing" ||
    gameState.session.state == "choosingbest" ||
    user.master ||
    user.voted
  const handleTableCardClick = (userId: string) => {
    if (gameState.session.state == "choosing") {
      sendJsonMessage({ type: "choose", details: { userId } })
    } else {
      sendJsonMessage({ type: "choosebest", details: { userId } })
    }
  }

  return (
    <div className="h-screen overflow-y-auto sm:relative">
      <div
        className="flex h-screen flex-col sm:h-auto sm:items-center sm:justify-center sm:gap-3"
        style={screenStyles}
      >
        <div className="sm:hidden">
          <UserList users={gameState.session.users} variant="game" />
        </div>
        <div className="sm: flex flex-auto flex-col items-center justify-center gap-[44px] px-2 py-2 sm:h-[342px] sm:flex-initial sm:flex-row sm:py-0 sm:px-0">
          <div
            className="aspect-[174/241] w-[100px] whitespace-pre-line rounded-lg bg-red-500 p-3 text-xs font-medium leading-[1.15] text-gray-100 sm:w-[174px] sm:p-4 sm:text-lg"
            style={{ hyphens: "manual" }}
          >
            {
              <Interweave
                content={typo(gameState.session.redCard, { hyphens: true })}
              />
            }
          </div>
          {gameState.session.votes.length > 0 && (
            <div className="grid w-full grid-cols-5 grid-rows-2 gap-1 sm:w-auto sm:gap-2">
              {gameState.session.votes.map(({ text, userId, visible }) => (
                <Card
                  key={text}
                  text={visible ? text : undefined}
                  disabled={
                    !user.master ||
                    (visible && gameState.session.state != "choosingbest") ||
                    (!visible && gameState.session.state != "choosing")
                  }
                  onClick={() => {
                    handleTableCardClick(userId)
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-4 px-2 pb-10 sm:h-[364px] sm:px-0 sm:pb-0">
          <div className="hidden sm:block">
            <UserList users={gameState.session.users} variant="game" />
          </div>
          <div className="flex w-full flex-col gap-2 sm:gap-3">
            <div className="relative h-[10px] w-full rounded-lg bg-gray-200">
              <div
                className={clsx(
                  "absolute left-0 top-0 h-full rounded-lg bg-red-500",
                  gameState.session.state == "voting" && "countdown"
                )}
              ></div>
            </div>
            <div className="grid grid-cols-[repeat(5,1fr)] grid-rows-2 gap-1 sm:gap-2">
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
    </div>
  )
}

const Card: React.FC<{
  text?: string
  onClick?: () => void
  disabled?: boolean
  lowerOpacity?: boolean
}> = ({ text, onClick, disabled, lowerOpacity }) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex aspect-[120/167] min-w-0 max-w-full rounded-lg bg-gray-100 p-2 text-left sm:w-[120px] sm:p-3",
        lowerOpacity && "opacity-60",
        !text && "items-center justify-center"
      )}
      disabled={disabled}
    >
      <span
        className={clsx(
          text &&
            "inline-block w-full whitespace-pre-line text-card font-medium leading-[1.15] sm:text-sm",
          !text && "flex items-center justify-center"
        )}
        style={{ hyphens: "manual" }}
      >
        {text ? (
          <Interweave content={typo(text, { hyphens: true })} />
        ) : (
          <Cat width="50%" height="50%" />
        )}
      </span>
    </button>
  )
}

export default Game
