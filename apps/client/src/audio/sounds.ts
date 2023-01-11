import type { Message as ReceiveMessage } from "@evil-cards/server/src/lib/ws/send"
import type { Entries } from "type-fest"

const sounds: Partial<Record<ReceiveMessage["type"], string>> = {
  gamestart: "/sounds/countdown.wav",
  userjoined: "/sounds/user-joined.wav",
  choose: "/sounds/flip-card.wav"
}
const cachedSounds: Partial<Record<ReceiveMessage["type"], HTMLAudioElement>> =
  {}
let preloadedSounds = false

export function processMessageAndPlaySound(message: ReceiveMessage) {
  const cachedSound = cachedSounds[message.type]
  const messageSound = sounds[message.type]

  if (!messageSound) {
    return
  }

  if (!cachedSound) {
    const audio = new Audio(messageSound)
    cachedSounds[message.type] = audio

    audio.play()

    return
  }

  cachedSound.play()
}

export function preloadSounds() {
  if (preloadedSounds) {
    return
  }

  for (const [key, value] of Object.entries(sounds) as Entries<typeof sounds>) {
    cachedSounds[key] = new Audio(value)
  }

  preloadedSounds = true
}

export const loh = "asd"
