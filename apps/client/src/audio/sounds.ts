import type { Message as ReceiveMessage } from "@evil-cards/server/src/lib/ws/send"

const sounds: Partial<Record<ReceiveMessage["type"], string>> = {
  gamestart: "/sounds/countdown.wav",
  userjoined: "/sounds/user-joined.wav",
  choose: "/sounds/flip-card.wav"
}
let preloadedSounds = false

export function processMessageAndPlaySound(message: ReceiveMessage) {
  const messageSound = sounds[message.type]

  if (!messageSound) {
    return
  }

  const audio = new Audio(messageSound)
  audio.play()
}

export function preloadSounds() {
  if (preloadedSounds) {
    return
  }

  for (const sound of Object.values(sounds)) {
    new Audio(sound)
  }

  preloadedSounds = true
}

export const loh = "asd"
