import { atom } from "jotai"

import { atomWithSafeStorage } from "@/core/atom-with-safe-storage"

import getRandomInt from "../functions/get-random-int"

import type { Player } from "@evil-cards/server/src/lib/ws/send"

export const winnersAtom = atom<[Player, Player, Player] | null>(null)

export const nicknameAtom = atomWithSafeStorage(
  "nickname",
  `Игрок${getRandomInt(1000, 9999)}`
)
export const avatarAtom = atomWithSafeStorage("avatar", 1)
export const soundsAtom = atomWithSafeStorage("sounds", true)
