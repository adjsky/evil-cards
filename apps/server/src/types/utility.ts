import type { WebSocket } from "ws"

export type DiscriminateUnion<T, K extends keyof T, V extends T[K]> = Extract<
  T,
  Record<K, V>
>

export type MapDiscriminatedUnion<
  T extends Record<K, string>,
  K extends keyof T
> = {
  [V in T[K]]: DiscriminateUnion<T, K, V>
}

export type UnwrapField<T, F extends string> = {
  [K in keyof T]: T[K] extends Record<F, unknown> ? T[K][F] : undefined
}

export type WithWebsocket<T> = {
  [K in keyof T]: T[K] extends undefined
    ? { socket: WebSocket }
    : T[K] & { socket: WebSocket }
}
