import type { Message } from "@kado/schemas/dist/server/send"

function stringify(record: Message, excludePrivate = false) {
  return JSON.stringify(record, (key, value) => {
    if (excludePrivate && key.startsWith("_")) {
      return undefined
    }

    return value
  })
}

export default stringify
