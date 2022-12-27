async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch (error) {
    alert(text)
  }
}

export default copyText
