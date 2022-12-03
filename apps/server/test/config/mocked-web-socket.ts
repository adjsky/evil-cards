import { EventEmitter } from "node:events"
import { jest } from "@jest/globals"

class MockedWebSocket extends EventEmitter {
  send = jest.fn()
  terminate = jest.fn()
}

export default MockedWebSocket
