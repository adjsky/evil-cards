import type { Message as ReceiveMessage } from "@evil-cards/server/src/lib/ws/send"

export function processMessageAndPlayAudio(message: ReceiveMessage) {
  switch (message.type) {
    case "votingstarted":
      speak(message.details.changedState.redCard.replaceAll("_", ""))
      break
    case "choose": {
      const voteText = message.details.changedState.votes.find(
        (vote) => vote.userId == message.details.choosedUserId
      )?.text

      if (voteText) {
        speak(voteText)
      }

      break
    }
  }
}

export function speak(text: string) {
  if (!("speechSynthesis" in window)) {
    return
  }

  const utterance = new SpeechSynthesisUtterance()
  utterance.text = text
  utterance.lang = "ru"
  utterance.rate = 0.95

  window.speechSynthesis.speak(utterance)
}
