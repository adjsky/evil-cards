import { atom } from "jotai"
import type { Vote, User, Status } from "@evil-cards/server/src/lib/ws/send"

type GameState = {
  users: User[]
  votes: Vote[]
  id: string
  userId: string
  status: Status
  redCard: string | null
  whiteCards: string[]
  votingEndsAt: number | null
}

export const gameStateAtom = atom<GameState | null>(null)
