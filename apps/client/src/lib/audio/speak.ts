import { notify } from "@/components/snackbar"

import type { Message as ReceiveMessage } from "@evil-cards/server/src/ws/send"

const VOICES_TIMEOUT_MS = 2500 // 2.5s
const LANG = "ru-RU"
const PRIORITIZED_VOICE_NAMES = ["Google русский"] as const

let prioritizedVoice: SpeechSynthesisVoice | undefined

export function processMessageAndSpeak(message: ReceiveMessage) {
  switch (message.type) {
    case "votingstart":
      speak(message.details.changedState.redCard.replaceAll("_", ""))

      break
    case "choose": {
      const text = message.details.changedState.votes.find(
        (vote) => vote.playerId == message.details.choosedPlayerId
      )?.card.text

      if (text) {
        speak(text)
      }

      break
    }
  }
}

export async function initSpeaker() {
  if (
    !("speechSynthesis" in window) ||
    !("SpeechSynthesisUtterance" in window)
  ) {
    notify({
      infinite: false,
      message:
        "Ваш браузер не поддерживает озвучку голосом. Озвучка текста будет недоступна.",
      severity: "information"
    })

    return
  }

  let voices = speechSynthesis.getVoices()

  // Wait for browser to load available voices
  if (voices.length == 0) {
    voices = await new Promise((resolve) => {
      const onVoiceChange = () => {
        resolve(speechSynthesis.getVoices())
      }

      speechSynthesis.addEventListener("voiceschanged", onVoiceChange)

      setTimeout(() => {
        speechSynthesis.removeEventListener("voiceschanged", onVoiceChange)
        resolve([])
      }, VOICES_TIMEOUT_MS)
    })
  }

  prioritizedVoice = voices.find((voice) =>
    PRIORITIZED_VOICE_NAMES.includes(voice.name)
  )
}

export function speak(text: string) {
  const utt = new SpeechSynthesisUtterance()
  utt.text = text
  utt.rate = 1.1
  utt.lang = LANG
  utt.voice = prioritizedVoice ?? null

  speechSynthesis.speak(utt)
}
