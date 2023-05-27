type Match<T, U> = {
  some: (val: T) => U
  none: (() => U) | U
}

type LazyArg<T> = () => T
type AsyncLazyArg<T> = () => Promise<T>

export type Option<T> = {
  match<U>(fn: Match<T, U>): U
} & (
  | {
      none: false
      some: true
      unwrap(): T
      or<U>(optb: Option<U>): Option<T>
    }
  | {
      none: true
      some: false
      unwrap(): never
      or<U>(optb: Option<U>): Option<U>
    }
)

function some<T>(val: T): Option<T> {
  return {
    none: false,
    some: true,
    match<U>(fn: Match<T, U>) {
      return fn.some(val)
    },
    or() {
      return this
    },
    unwrap() {
      return val
    }
  }
}

function none<T>(): Option<T> {
  return {
    none: true,
    some: false,
    match<U>(matchObject: Match<T, U>) {
      const { none } = matchObject

      if (typeof none === "function") {
        return (none as () => U)()
      }

      return none
    },
    or<U>(optb: Option<U>) {
      return optb
    },
    unwrap() {
      throw new ReferenceError("Trying to unwrap None.")
    }
  }
}

function tryCatch<T>(f: LazyArg<T>): Option<T> {
  try {
    return some(f())
  } catch (error) {
    return none()
  }
}

async function asyncTryCatch<T>(f: AsyncLazyArg<T>): Promise<Option<T>> {
  try {
    return some(await f())
  } catch (error) {
    return none()
  }
}

export const Option = {
  some,
  none,
  tryCatch,
  asyncTryCatch
}
