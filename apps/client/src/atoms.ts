import { atom } from "jotai"
import type { Session } from "@kado/schemas/server/send"

export const sessionAtom = atom<Session | null>(null)
