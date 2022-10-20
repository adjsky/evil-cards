import React from "react"
import { useAtom } from "jotai"
import clsx from "clsx"

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

  return (
    <div className="relative h-screen">
      <div
        className="flex flex-col items-center justify-center gap-3"
        style={screenStyles}
      >
        <div className="flex h-[342px] items-center justify-center gap-[49px]">
          <div className="h-[241px] w-[174px] break-words rounded-lg bg-red-500 p-4 text-lg font-medium leading-[1.15] text-gray-100">
            {gameState.session.redCard}
          </div>
          <div className="grid grid-cols-5 grid-rows-2 gap-2">
            {gameState.session.votes.map(({ text, userId, visible }) => (
              <Card
                key={text}
                text={visible ? text : undefined}
                disabled={
                  !user.master ||
                  (visible && gameState.session.state == "choosing")
                }
                onClick={() => {
                  if (gameState.session.state == "choosing") {
                    sendJsonMessage({ type: "choose", details: { userId } })
                  } else {
                    sendJsonMessage({ type: "choosebest", details: { userId } })
                  }
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex h-[364px] gap-4">
          <UserList users={gameState.session.users} variant="game" />
          <div className="flex flex-col gap-3">
            <div className="relative h-[10px] w-full rounded-lg bg-gray-200">
              <div
                className={clsx(
                  "absolute left-0 top-0 h-full rounded-lg bg-red-500",
                  gameState.session.state == "voting" && "countdown"
                )}
              ></div>
            </div>
            <div className="grid grid-cols-[repeat(5,1fr)] grid-rows-2 gap-2">
              {gameState.whiteCards.map((text) => (
                <Card
                  key={text}
                  text={text}
                  onClick={() =>
                    sendJsonMessage({ type: "vote", details: { text } })
                  }
                  disabled={
                    gameState.session.state == "choosing" ||
                    gameState.session.state == "choosingbest" ||
                    user.master ||
                    user.voted
                  }
                  lowerOpacity={
                    gameState.session.state == "choosing" ||
                    gameState.session.state == "choosingbest" ||
                    user.master ||
                    user.voted
                  }
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
        "flex h-[167px] w-[120px] rounded-lg bg-gray-100 p-3 text-left",
        lowerOpacity && "opacity-60",
        !text && "items-center justify-center"
      )}
      disabled={disabled}
    >
      <span
        className={clsx(
          text &&
            "inline-block w-full break-words text-sm font-medium leading-[1.15]",
          !text && "flex items-center justify-center"
        )}
      >
        {text ?? <Cat />}
      </span>
    </button>
  )
}

export default Game
