import clsx from "clsx"
import Image from "next/image"
import React, { useState } from "react"

import { getScoreLabel } from "@/lib/functions"

import CheckMark from "@/assets/check-mark.svg"
import Close from "@/assets/close/rounded.svg"
import Crown from "@/assets/crown.svg"
import Question from "@/assets/question.svg"

import ExclamationTriangleIcon from "../assets/exclamation-triangle.svg"
import Button from "./button"
import Modal from "./modal"

import type { Player } from "@evil-cards/server/src/lib/ws/send"

const PlayerList: React.FC<{
  withKick?: boolean
  players: Player[]
  variant: "game" | "waiting"
  onKick?: (player: Player) => void
}> = ({ withKick, players, variant, onKick }) => {
  const filteredPlayers = players.filter(
    (player) => player.disconnected == false
  )

  return (
    <div
      className="sm:scrollable flex w-full touch-pan-x overflow-x-auto sm:h-full sm:w-auto sm:flex-col sm:gap-2"
      data-testid="player-list"
    >
      {filteredPlayers.map((player) => (
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
        Array.from({ length: 10 - filteredPlayers.length }).map((_, index) => (
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
  const displayKick = withKick && variant == "waiting" && player && !player.host

  return (
    <>
      <div
        className="flex max-w-[70px] flex-shrink-0 flex-col items-center gap-1 p-2 pb-0 sm:hidden"
        data-testid="player-mobile"
      >
        <div
          className="relative h-[44px] w-[44px] flex-none"
          onClick={() => {
            if (!displayKick) {
              return
            }

            setKickModalOpen(true)
          }}
        >
          {player ? (
            <Image
              src={`/avatars/${player.avatarId}.svg`}
              width={44}
              height={44}
              alt="Avatar"
              className="overflow-hidden rounded-full bg-gray-200"
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
              className={clsx(
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
  const displayKick = withKick && variant == "waiting" && player && !player.host

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
          <Image
            src={`/avatars/${player.avatarId}.svg`}
            width={48}
            height={48}
            alt="Avatar"
            className="flex-shrink-0 overflow-hidden rounded-full bg-gray-200"
          />
        ) : (
          <Question />
        )}
        <div
          className={clsx(
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
