import type { Message } from "@kado/schemas/dist/server/send"

function stringify(record: Message) {
  return JSON.stringify(record)
}

export default stringify
