import React, { useMemo, useState } from "react"

import cn from "@/lib/functions/cn"
import getScoreLabel from "@/lib/functions/get-score-label"

import { ReactComponent as CheckMark } from "@/assets/check-mark.svg"
import { ReactComponent as Close } from "@/assets/close/rounded.svg"
import { ReactComponent as Crown } from "@/assets/crown.svg"
import { ReactComponent as ExclamationTriangleIcon } from "@/assets/exclamation-triangle.svg"
import { ReactComponent as Question } from "@/assets/question.svg"

import Button from "./button"
import Modal from "./modal"

import type { Player } from "@evil-cards/server/src/ws/send"

const PlayerList: React.FC<{
  className?: string
  withKick: boolean
  players: Player[]
  variant: "game" | "waiting"
  onKick?: (player: Player) => void
}> = ({ className, withKick, players, variant, onKick }) => {
  const playersToRender = useMemo(() => {
    const p = players.filter((player) => !player.disconnected)

    if (variant == "game") {
      p.sort((a, b) => b.score - a.score)
    }

    return p
  }, [players, variant])

  return (
    <div
      className={cn(
        "sm:scrollable flex w-full touch-pan-x overflow-x-auto sm:h-full sm:w-auto sm:flex-col sm:gap-2",
        className
      )}
      data-testid="player-list"
    >
      {playersToRender.map((player) => (
        <React.Fragment key={player.id}>
          <DesktopPlayer
            player={player}
            variant={variant}
            withKick={withKick}
            onKick={() => onKick?.(player)}
          />
          <MobilePlayer
            player={player}
            variant={variant}
            withKick={withKick}
            onKick={() => onKick?.(player)}
          />
        </React.Fragment>
      ))}
      {variant == "waiting" &&
        Array.from({ length: 10 - playersToRender.length }).map((_, index) => (
          <React.Fragment key={index}>
            <MobilePlayer variant={variant} />
            <DesktopPlayer variant={variant} />
          </React.Fragment>
        ))}
    </div>
  )
}

const MobilePlayer: React.FC<{
  withKick?: boolean
  player?: Player
  variant: "game" | "waiting"
  onKick?: () => void
}> = ({ withKick, player, variant, onKick }) => {
  const [isKickModalOpen, setKickModalOpen] = useState(false)

  const displayCrown =
    (variant == "waiting" && player?.host) ||
    (variant == "game" && player?.master)
  const displayMark = variant == "game" && player?.voted
  const displayKick = withKick && player && !player.host

  return (
    <>
      <div
        className="flex max-w-[70px] flex-shrink-0 flex-col items-center gap-1 p-2 pb-0 sm:hidden"
        data-testid="player-mobile"
      >
        <div
          className="relative flex-none"
          onClick={() => {
            if (!displayKick) {
              return
            }

            setKickModalOpen(true)
          }}
        >
          {player ? (
            <img
              src={`/avatars/${player.avatarId}.svg`}
              width={44}
              height={44}
              alt={`Аватар ${player.avatarId}`}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <Question width={44} height={44} />
          )}
          {displayCrown && (
            <div className="absolute bottom-0 left-0">
              <Crown />
            </div>
          )}
          {(displayMark || displayKick) && (
            <div
              className={cn(
                "absolute bottom-0 right-0",
                displayKick && "rounded-full bg-gray-100 p-1"
              )}
            >
              {displayMark && <CheckMark />}
              {displayKick && <Close className="h-2 w-2 fill-red-500" />}
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
      <KickModal
        player={player}
        isOpen={isKickModalOpen}
        onAccept={() => {
          setKickModalOpen(false)
          onKick?.()
        }}
        onClose={() => setKickModalOpen(false)}
      />
    </>
  )
}

const DesktopPlayer: React.FC<{
  withKick?: boolean
  player?: Player
  variant: "game" | "waiting"
  onKick?: () => void
}> = ({ withKick, player, variant, onKick }) => {
  const [isKickModalOpen, setKickModalOpen] = useState(false)

  const displayCrown =
    (variant == "waiting" && player?.host) ||
    (variant == "game" && player?.master)
  const displayCheckMark = variant == "game" && player?.voted
  const displayKick = withKick && player && !player.host

  return (
    <>
      <div
        className="hidden w-[194px] items-center gap-2 rounded-xl border-2 border-gray-200 px-2 py-1 sm:flex"
        data-testid="player-desktop"
      >
        {(displayCheckMark || displayCrown) && (
          <div className="flex w-[16px] justify-center">
            {displayCrown && <Crown />}
            {displayCheckMark && <CheckMark />}
          </div>
        )}
        {player ? (
          <img
            src={`/avatars/${player.avatarId}.svg`}
            width={48}
            height={48}
            alt={`Аватар ${player.avatarId}`}
            className="flex-shrink-0"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <Question />
        )}
        <div
          className={cn(
            "flex min-w-0 flex-grow flex-col gap-1",
            player ? "text-gray-100" : "text-gray-600"
          )}
        >
          <div className="flex-grow overflow-hidden overflow-ellipsis text-xs">
            {player?.nickname ?? "Пусто"}
          </div>
          {player && variant == "game" && (
            <span className="text-base font-medium leading-none">
              {player.score} {getScoreLabel(player.score)}
            </span>
          )}
        </div>
        {displayKick && (
          <button className="p-0.5" onClick={() => setKickModalOpen(true)}>
            <Close className="h-3 w-3 fill-gray-100" />
          </button>
        )}
      </div>
      <KickModal
        player={player}
        isOpen={isKickModalOpen}
        onAccept={() => {
          setKickModalOpen(false)
          onKick?.()
        }}
        onClose={() => setKickModalOpen(false)}
      />
    </>
  )
}

const KickModal: React.FC<{
  player?: Player
  isOpen?: boolean
  onAccept?: () => void
  onClose?: () => void
}> = ({ player, isOpen, onAccept, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-sm rounded-xl bg-gray-900 p-6 text-gray-100 shadow-lg"
    >
      <Modal.Title as="h3" className="text-center text-xl font-bold uppercase">
        Выгнать игрока?
      </Modal.Title>

      <ExclamationTriangleIcon className="mx-auto my-3 h-24 w-24 fill-red-500" />

      <Modal.Description className="text-center font-medium">
        Вы точно хотите выгнать игрока{" "}
        <span className="font-bold">{player?.nickname}</span>?
      </Modal.Description>

      <div className="mt-4 flex w-full gap-2">
        <Button
          variant="outlined"
          className="flex-1 py-3 uppercase"
          onClick={onClose}
        >
          Нет
        </Button>
        <Button
          variant="filledBorder"
          className="flex-1 uppercase"
          onClick={onAccept}
        >
          Да
        </Button>
      </div>
    </Modal>
  )
}

export default PlayerList
