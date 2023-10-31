import type { Message as ReceiveMessage } from "@evil-cards/server/src/ws/send"

const soundPaths: Partial<Record<ReceiveMessage["type"], string>> = {
  gamestart: "/sounds/countdown.wav",
  playerjoin: "/sounds/player-joined.wav",
  choose: "/sounds/flip-card.wav"
}

const sounds: Partial<Record<ReceiveMessage["type"], HTMLAudioElement>> = {}

export function preloadSounds() {
  for (const [key, value] of Object.entries(soundPaths)) {
    const audio = new Audio(value)

    sounds[key as ReceiveMessage["type"]] = audio
  }
}

export async function processMessageAndPlaySound(message: ReceiveMessage) {
  const audio = sounds[message.type]

  try {
    await audio?.play()
  } catch (error) {
    console.error(error)
  }
}
