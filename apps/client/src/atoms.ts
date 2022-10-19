import { atom } from "jotai"
import type { Session } from "@kado/schemas/client/receive"

type GameState = {
  session: Session
  userId: string
  whiteCards: string[]
}

export const gameStateAtom = atom<GameState | null>(null)
