import { atom } from "jotai"
import type { Vote, User, Status } from "@kado/schemas/dist/client/receive"

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
