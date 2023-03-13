import { EventEmitter } from "node:events"
import { jest } from "@jest/globals"

class MockedWebSocket extends EventEmitter {
  send = jest.fn()
  terminate = jest.fn()

  clearMocks() {
    for (const key of Object.keys(this)) {
      const value = this[key as keyof MockedWebSocket]

      if (jest.isMockFunction(value)) {
        value.mockClear()
      }
    }
  }
}

export default MockedWebSocket
