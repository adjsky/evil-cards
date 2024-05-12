import EasySpeech from "easy-speech"

import { notify } from "@/components/snackbar"

import type { Message as ReceiveMessage } from "@evil-cards/server/src/ws/send"

const allowedNames = ["Google русский"]

let voice: SpeechSynthesisVoice | undefined

export function processMessageAndSpeak(message: ReceiveMessage) {
  switch (message.type) {
    case "votingstart":
      speak(message.details.changedState.redCard.replaceAll("_", ""))
      break
    case "choose": {
      const voteText = message.details.changedState.votes.find(
        (vote) => vote.playerId == message.details.choosedPlayerId
      )?.card.text

      if (voteText) {
        speak(voteText)
      }

      break
    }
  }
}

export async function initSpeaker() {
  try {
    await EasySpeech.init()

    const voices = EasySpeech.voices()
    voice = voices.find((voice) => allowedNames.includes(voice.name))

    if (!voice) {
      notify({
        infinite: false,
        message:
          "Ваш браузер не поддерживает необходимые голоса озвучки. Озвучка текста будет недоступна.",
        severity: "information"
      })
    }
  } catch (error) {
    notify({
      infinite: false,
      message:
        "Ваш браузер не поддерживает озвучку голосом. Озвучка текста будет недоступна.",
      severity: "information"
    })
    console.error(error)
  }
}

export function speak(text: string) {
  if (!voice) {
    return
  }

  EasySpeech.speak({
    text,
    voice: voice
  }).catch((error) => console.error(error))
}
