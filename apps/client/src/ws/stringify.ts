import type { Message } from "@kado/schemas/client/send"

function stringify(record: Message) {
  return JSON.stringify(record)
}

export default stringify
