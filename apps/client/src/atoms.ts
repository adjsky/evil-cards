import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import type {
  Vote,
  User,
  Status,
  Configuration
} from "@evil-cards/server/src/lib/ws/send"

export type GameState = {
  users: User[]
  votes: Vote[]
  id: string
  userId: string
  status: Status
  configuration: Configuration
  redCard: string | null
  whiteCards: string[]
  votingEndsAt: number | null
  winners: User[] | null
}

export const gameStateAtom = atom<GameState | null>(null)
export const usernameAtom = atomWithStorage("username", "Игрок")
export const avatarAtom = atomWithStorage("avatar", 1)
export const soundsAtom = atom(true)
