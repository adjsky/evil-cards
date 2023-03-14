type PickByValue<T, ValueType> = Pick<
  T,
  {
    [Key in keyof T]: T[Key] extends ValueType ? Key : never
  }[keyof T]
>

function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): PickByValue<T, T[K]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = {} as any

  keys.forEach((key) => {
    result[key] = obj[key]
  })

  return result
}

export default pick
