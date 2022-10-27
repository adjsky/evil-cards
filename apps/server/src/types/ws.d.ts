import type { User } from "@kado/schemas/dist/server/send"
import type Session from "../game/session"

declare module "ws" {
  class _WS extends WebSocket {}
  export interface WebSocket extends _WS {
    session?: Session | null
    user?: User | null
    alive?: boolean
  }
}
