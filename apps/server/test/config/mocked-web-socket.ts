import { EventEmitter } from "node:events"

import { vi } from "vitest"

class MockedWebSocket extends EventEmitter {
  send = vi.fn()
  terminate = vi.fn()

  clearMocks() {
    for (const key of Object.keys(this)) {
      const value = this[key as keyof MockedWebSocket]

      if (vi.isMockFunction(value)) {
        value.mockClear()
      }
    }
  }
}

export default MockedWebSocket
