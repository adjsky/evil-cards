import { nanoid } from "nanoid"
import type { WebSocket } from "ws"
import type { CreateRoomDetails } from "./schemas"

type User = {
  name: string
  _socket: WebSocket
}
type Session = {
  users: User[]
}

export class SessionManager {
  private session: Session

  constructor(details: CreateRoomDetails, socket: WebSocket) {
    this.session = {
      users: [{ name: details.username, _socket: socket }]
    }
  }

  get() {
    return this.session
  }

  toString() {
    return JSON.stringify(this.session, (key, value) => {
      if (key.startsWith("_")) {
        return undefined
      }

      return value
    })
  }
}

export class SessionsManager {
  private sessions: Map<string, SessionManager>

  constructor() {
    this.sessions = new Map()
  }

  createSession(details: CreateRoomDetails, socket: WebSocket) {
    const roomId = nanoid(5)
    const sessionManager = new SessionManager(details, socket)

    this.sessions.set(roomId, sessionManager)

    return sessionManager
  }
}
