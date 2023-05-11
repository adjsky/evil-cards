import type { Player } from "../game/types.ts"
import type { ISession } from "../game/interfaces.ts"

declare module "ws" {
  class _WS extends WebSocket {}
  export interface WebSocket extends _WS {
    session?: ISession | null
    player?: Player | null
    alive?: boolean
  }
}
