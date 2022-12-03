import type { Message } from "./send"

/**
 * Wrapper around JSON.stringify,
 * accepts a typed record to ensure type safety.
 */
function stringify(record: Message) {
  return JSON.stringify(record)
}

export default stringify
