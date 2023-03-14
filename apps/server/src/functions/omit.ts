type OmitByValue<T, ValueType> = Omit<
  T,
  {
    [Key in keyof T]: T[Key] extends ValueType ? Key : never
  }[keyof T]
>

function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): OmitByValue<T, T[K]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = {} as any

  for (const key in obj) {
    if (!keys.includes(key as unknown as K)) {
      result[key] = obj[key]
    }
  }

  return result
}

export default omit
