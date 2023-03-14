import React from "react"
import Image from "next/image"
import clsx from "clsx"

import { getScoreLabel } from "@/lib/functions"

import CheckMark from "@/assets/check-mark.svg"
import Crown from "@/assets/crown.svg"
import Question from "@/assets/question.svg"

import type { Player as PlayerType } from "@evil-cards/server/src/lib/ws/send"

const DesktopPlayerList: React.FC<{
  players: PlayerType[]
  variant: "game" | "waiting"
}> = ({ players, variant }) => {
  const filteredPlayers = players.filter(
    (player) => player.disconnected == false
  )

  return (
    <div
      className="scrollable hidden h-full flex-col gap-2 pr-2 sm:flex"
      data-testid="player-list"
    >
      {filteredPlayers.map((player) => (
        <Player key={player.id} player={player} variant={variant} />
      ))}
      {variant == "waiting" &&
        Array.from({ length: 10 - filteredPlayers.length }).map((_, index) => (
          <Player key={index} variant={variant} />
        ))}
    </div>
  )
}

const Player: React.FC<{
  player?: PlayerType
  variant: "game" | "waiting"
}> = ({ player, variant }) => {
  const displayCrown =
    (variant == "waiting" && player?.host) ||
    (variant == "game" && player?.master)
  const displayCheckMark = variant == "game" && player?.voted

  return (
    <div className="flex w-[194px] items-center gap-2 rounded-xl border-2 border-gray-200 px-2 py-1">
      {(displayCheckMark || displayCrown) && (
        <div className="flex w-[16px] justify-center">
          {displayCrown && <Crown />}
          {displayCheckMark && <CheckMark />}
        </div>
      )}
      {player ? (
        <Image
          src={`/avatars/${player.avatarId}.svg`}
          width={48}
          height={48}
          alt=""
        />
      ) : (
        <Question />
      )}
      <div
        className={clsx(
          "flex flex-col gap-1",
          player ? "text-gray-100" : "text-gray-600"
        )}
      >
        <span className="text-xs leading-none">
          {player?.nickname ?? "Пусто"}
        </span>
        {player && variant == "game" && (
          <span className="text-base font-medium leading-none">
            {player.score} {getScoreLabel(player.score)}
          </span>
        )}
      </div>
    </div>
  )
}

export default DesktopPlayerList
