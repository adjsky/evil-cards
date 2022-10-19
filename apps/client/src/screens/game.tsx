import React, { useState, useEffect } from "react"
import Image from "next/future/image"
import { useAtom } from "jotai"
import clsx from "clsx"

import { gameStateAtom } from "../atoms"
import { useSocket } from "../ws/hooks"

import { Crown } from "../components/icons"
import cat from "../assets/cat.svg"

import type { User } from "@kado/schemas/client/receive"
import type { Message as ReceiveMessage } from "@kado/schemas/client/receive"
import type { Message as SendMessage } from "@kado/schemas/client/send"

const Game: React.FC = () => {
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [gameState, setGameState] = useAtom(gameStateAtom)
  const visible =
    gameState?.session.state != "end" && gameState?.session.state != "waiting"

  const { sendJsonMessage } = useSocket<SendMessage, ReceiveMessage>({
    onJsonMessage(data) {
      if (!visible || !gameState) {
        return
      }

      if (
        data.type == "choose" ||
        data.type == "choosingstarted" ||
        data.type == "choosingbeststarted" ||
        data.type == "voted"
      ) {
        setGameState({ ...gameState, session: data.details.session })
      }

      if (data.type == "votingstarted") {
        setGameState({
          ...gameState,
          session: data.details.session,
          whiteCards: data.details.whiteCards
        })
      }

      if (data.type == "votingtimeleft") {
        setSecondsLeft(data.details.secondsLeft)
      }
    }
  })

  const [scaleFactor, setScaleFactor] = useState(1)
  useEffect(() => {
    const computeScale = () => {
      if (window.innerWidth < 880) {
        setScaleFactor(window.innerWidth / 880)
      } else {
        setScaleFactor(1)
      }
    }
    window.addEventListener("resize", computeScale)

    return () => {
      window.removeEventListener("resize", computeScale)
    }
  })

  if (!visible || !gameState) {
    return null
  }
  const user = gameState.session.users.find(
    (user) => user.id == gameState.userId
  )
  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center py-10">
      <div
        className="flex flex-col items-center justify-center gap-3"
        style={{ transform: `scale(${scaleFactor})` }}
      >
        <div className="flex h-[342px] items-center justify-center gap-[49px]">
          <div className="h-[241px] w-[174px] rounded-lg bg-red-500 p-4 text-lg font-medium leading-[1.15] text-gray-100">
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
          <Leaderboard users={gameState.session.users} />
          <div className="flex flex-col gap-3">
            <div className="relative h-[10px] w-full rounded-lg bg-gray-200">
              <div
                className={clsx(
                  "absolute left-0 top-0 h-full w-0 rounded-lg bg-red-500",
                  gameState.session.state == "voting" &&
                    secondsLeft != 30 &&
                    "transition-[width] duration-1000 ease-linear"
                )}
                style={{
                  width: `${
                    gameState.session.state == "voting"
                      ? (100 * (30 - secondsLeft)) / 30
                      : 0
                  }%`
                }}
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
                    gameState.session.state == "choosing" || user.master
                  }
                  lowerOpacity={
                    gameState.session.state == "choosing" || user.master
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

const User: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="flex w-[194px] items-center gap-2 rounded-xl border-2 border-gray-200 px-2 py-1">
      {user.master && <Crown />}
      <Image src={cat} width={48} height={48} alt="" />
      <div className="flex flex-col gap-1 text-gray-100">
        <span className="text-xs leading-none">{user.username}</span>
        <span className="text-base font-medium leading-none">
          {user.score}{" "}
          {user.score == 0 ? "очков" : user.score == 1 ? "очко" : "очка"}
        </span>
      </div>
    </div>
  )
}

const Leaderboard: React.FC<{ users: User[] }> = ({ users }) => {
  return (
    <div className="scrollable flex h-full flex-col gap-2 pr-2">
      {users.map((user) => (
        <User key={user.id} user={user} />
      ))}
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
        lowerOpacity && "opacity-60"
      )}
      disabled={disabled}
    >
      <span className="inline-block w-full break-words text-sm font-medium leading-[1.15]">
        {text}
      </span>
    </button>
  )
}

export default Game
