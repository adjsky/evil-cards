export type Callback = (...args: never[]) => void

/** Timeout wrapper that allows to use date. */
export class DateTimeout {
  private _handle: NodeJS.Timeout
  private _date: Date

  public constructor(callback: Callback, date: Date) {
    this._handle = setTimeout(callback, date.valueOf() - Date.now())
    this._date = date
  }

  public get date() {
    return this._date
  }

  /** Clears underlying timeout handle (calls clearTimeout). */
  public clear() {
    clearTimeout(this._handle)
  }
}

/**
 * Wrapper around DateTimeout constructor.
 * Used to create timeouts in setTimeout/setInterval way.
 */
export function setDateTimeout(callback: Callback, date: Date) {
  return new DateTimeout(callback, date)
}
