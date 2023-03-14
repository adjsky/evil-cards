import React from "react"
import Image from "next/image"

import { getScoreLabel } from "@/lib/functions"

import CheckMark from "@/assets/check-mark.svg"
import Crown from "@/assets/crown.svg"
import Question from "@/assets/question.svg"

import type { Player as PlayerType } from "@evil-cards/server/src/lib/ws/send"

const MobilePlayerList: React.FC<{
  players: PlayerType[]
  variant: "game" | "waiting"
}> = ({ players, variant }) => {
  const filterePlayers = players.filter(
    (player) => player.disconnected == false
  )

  return (
    <div className="w-full overflow-x-auto sm:hidden">
      <div className="flex" data-testid="player-list">
        {filterePlayers.map((player) => (
          <Player key={player.id} player={player} variant={variant} />
        ))}
        {variant == "waiting" &&
          Array.from({ length: 10 - filterePlayers.length }).map((_, index) => (
            <Player key={index} variant={variant} />
          ))}
      </div>
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
  const displayMark = variant == "game" && player?.voted

  return (
    <div className="flex w-[70px] flex-col items-center gap-1 p-2 pb-0">
      <div className="relative h-[44px] w-[44px] flex-none">
        {player ? (
          <Image
            src={`/avatars/${player.avatarId}.svg`}
            width={44}
            height={44}
            alt=""
          />
        ) : (
          <Question width={44} height={44} />
        )}
        {displayCrown && (
          <div className="absolute left-0 bottom-0">
            <Crown />
          </div>
        )}
        {displayMark && (
          <div className="absolute right-0 bottom-0">
            <CheckMark />
          </div>
        )}
      </div>
      <div className="flex flex-col items-center justify-center text-gray-100">
        {variant == "game" && player && (
          <span className="text-xs font-medium">
            {player.score} {getScoreLabel(player.score)}
          </span>
        )}
        <span className="inline-block max-w-[60px] overflow-hidden overflow-ellipsis whitespace-nowrap text-[10px]">
          {player?.nickname ?? "Пусто"}
        </span>
      </div>
    </div>
  )
}

export default MobilePlayerList
