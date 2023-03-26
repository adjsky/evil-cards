import EasySpeech from "easy-speech"
import type { Message as ReceiveMessage } from "@evil-cards/server/src/lib/ws/send"

const allowedLanguages = ["ru", "ru-RU"]
const allowedNames = ["Google русский"]

export function processMessageAndSpeak(message: ReceiveMessage) {
  switch (message.type) {
    case "votingstart":
      speak(message.details.changedState.redCard.replaceAll("_", ""))
      break
    case "choose": {
      const voteText = message.details.changedState.votes.find(
        (vote) => vote.playerId == message.details.choosedPlayerId
      )?.text

      if (voteText) {
        speak(voteText)
      }

      break
    }
  }
}

export function speak(text: string) {
  const status = EasySpeech.status()

  if (!status.initialized) {
    return
  }

  const voices = EasySpeech.voices()
  const voice = voices.filter(
    (voice) =>
      allowedLanguages.includes(voice.lang) && allowedNames.includes(voice.name)
  )

  if (!voice[0]) {
    return
  }

  EasySpeech.speak({
    text,
    voice: voice[0]
  }).catch((error) => console.error(error))
}
