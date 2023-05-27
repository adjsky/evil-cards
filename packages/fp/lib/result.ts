type Match<O, E, T> = {
  ok: (val: O) => T
  err: (val: E) => T
}

type LazyArg<T> = () => T
type AsyncLazyArg<T> = () => Promise<T>

export type Result<O, E> = {
  match<T>(fn: Match<O, E, T>): T
} & (
  | {
      ok: true
      unwrap(): O
      unwrapErr(): never
    }
  | {
      ok: false
      unwrap(): never
      unwrapErr(): E
    }
)

function ok<O, E>(value: O): Result<O, E> {
  return {
    ok: true,
    unwrap() {
      return value
    },
    unwrapErr() {
      throw new ReferenceError("Cannot unwrap Err value of Result.Ok")
    },
    match<U>(matchObject: Match<O, never, U>) {
      return matchObject.ok(value)
    }
  }
}

function err<O, E>(err: E): Result<O, E> {
  return {
    ok: false,
    unwrap() {
      throw new ReferenceError("Cannot unwrap Ok value of Result.Err")
    },
    unwrapErr() {
      return err
    },
    match<U>(matchObject: Match<never, E, U>) {
      return matchObject.err(err)
    }
  }
}

type OnError = (error: unknown) => void

function tryCatch<O, E = Error>(
  f: LazyArg<Exclude<O, Promise<unknown>>>,
  onError?: OnError
): Result<O, E> {
  try {
    return ok(f())
  } catch (error) {
    if (onError) {
      onError(error)
    }

    return err(error as E)
  }
}

async function asyncTryCatch<O, E = Error>(
  f: AsyncLazyArg<O>,
  onError?: OnError
): Promise<Result<O, E>> {
  try {
    return ok(await f())
  } catch (error) {
    if (onError) {
      onError(error)
    }

    return err(error as E)
  }
}

export const Result = {
  err,
  ok,
  tryCatch,
  asyncTryCatch
}
