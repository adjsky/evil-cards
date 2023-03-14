import type { Message as ReceiveMessage } from "@evil-cards/server/src/lib/ws/send"

const sounds: Partial<Record<ReceiveMessage["type"], string>> = {
  gamestart: "/sounds/countdown.wav",
  playerjoin: "/sounds/player-joined.wav",
  choose: "/sounds/flip-card.wav"
}

export function processMessageAndPlaySound(message: ReceiveMessage) {
  const messageSound = sounds[message.type]

  if (!messageSound) {
    return
  }

  const audio = new Audio(messageSound)
  audio.play()
}
