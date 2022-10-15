function stringify<T extends Record<string, unknown>>(
  record: T,
  excludePrivate = false
) {
  return JSON.stringify(record, (key, value) => {
    if (excludePrivate && key.startsWith("_")) {
      return undefined
    }

    return value
  })
}

export default stringify
