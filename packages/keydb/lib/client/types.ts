export type CallableAsyncKeys<T> = keyof {
  [P in keyof T as T[P] extends () => Promise<unknown> ? P : never]: unknown
}

export type CallableSyncKeys<T> = keyof {
  [P in keyof T as T[P] extends () => unknown
    ? T[P] extends () => Promise<unknown>
      ? never
      : P
    : never]: unknown
}

export type CallableKeys<T> = keyof {
  [P in keyof T as T[P] extends () => unknown ? P : never]: unknown
}
