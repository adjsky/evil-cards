import { notify } from "@/components/snackbar"

import type { Message as ReceiveMessage } from "@evil-cards/server/src/ws/send"

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

export function initSpeaker() {
  if ("speechSynthesis" in window && "SpeechSynthesisUtterance" in window) {
    return
  }

  notify({
    infinite: false,
    message:
      "Ваш браузер не поддерживает озвучку текста голосом. Озвучка текста будет недоступна.",
    severity: "information"
  })
}

export function speak(text: string) {
  const utt = new SpeechSynthesisUtterance()
  utt.text = text
  utt.rate = 1
  utt.lang = "ru-RU"

  window.speechSynthesis.speak(utt)
}
