import type { Session, User } from "../game/types"

declare module "ws" {
  class _WS extends WebSocket {}
  export interface WebSocket extends _WS {
    session?: Session
    user?: User
  }
}
