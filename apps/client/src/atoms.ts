import { atom } from "jotai"
import type { Vote, User, Status } from "@evil-cards/server/src/ws/send"

type GameState = {
  users: User[]
  votes: Vote[]
  id: string
  userId: string
  status: Status
  redCard: string | null
  whiteCards: string[]
}

export const gameStateAtom = atom<GameState | null>(null)
