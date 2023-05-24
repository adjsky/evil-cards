import { atom } from "jotai"
import { atomWithSafeStorage } from "@/core/atom-with-safe-storage"
import getRandomInt from "./functions/get-random-int"

import type {
  Vote,
  Player,
  Status,
  Configuration,
  Card
} from "@evil-cards/server/src/lib/ws/send"

export type GameState = {
  players: Player[]
  votes: Vote[]
  id: string
  playerId: string
  status: Status
  configuration: Configuration
  redCard: string | null
  deck: Card[]
  votingEndsAt: number | null
  winners: Player[] | null
}

export const gameStateAtom = atom<GameState | null>(null)
export const nicknameAtom = atomWithSafeStorage(
  "nickname",
  `Игрок${getRandomInt(1000, 9999)}`
)
export const avatarAtom = atomWithSafeStorage("avatar", 1)
export const soundsAtom = atomWithSafeStorage("sounds", true)

export const reconnectingGameAtom = atom(false)
