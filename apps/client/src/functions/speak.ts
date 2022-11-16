function speak(text: string) {
  const utterance = new SpeechSynthesisUtterance()
  utterance.text = text.replaceAll("_", "")
  utterance.lang = "ru"
  utterance.rate = 0.95
  window.speechSynthesis.speak(utterance)
}

export default speak
