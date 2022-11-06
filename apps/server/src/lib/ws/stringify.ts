import type { Message } from "./send"

function stringify(record: Message) {
  return JSON.stringify(record)
}

export default stringify
