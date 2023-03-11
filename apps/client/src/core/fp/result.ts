export type Match<O, E, T> = {
  ok: (val: O) => T
  err: (val: E) => T
}

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

export function ok<O, E>(value: O): Result<O, E> {
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

export function err<O, E>(err: E): Result<O, E> {
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
