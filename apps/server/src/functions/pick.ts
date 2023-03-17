function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = {} as any

  keys.forEach((key) => {
    result[key] = obj[key]
  })

  return result
}

export default pick
