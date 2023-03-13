import { jest } from "@jest/globals"
import { ALIVE_CHECK_INTERVAL_MS } from "../../src/game/constants"
import { mock, mockClear } from "jest-mock-extended"

import type { ISessionManager } from "../../src/game/intefaces"

jest.unstable_mockModule(
  "ws",
  async () => await import("../config/mocked-web-socket")
)

const Controller = (await import("../../src/game/controller")).default
const WebSocket = (await import("ws")).default

const sessionManager = mock<ISessionManager>()

afterEach(() => {
  mockClear(sessionManager)
})

it("terminates connection after two failed pings", () => {
  const controller = new Controller(sessionManager)
  const socket = new WebSocket("")

  jest.useFakeTimers()

  controller.handleConnection(socket)

  jest.advanceTimersByTime(ALIVE_CHECK_INTERVAL_MS)
  expect(socket.terminate).not.toBeCalled()

  jest.advanceTimersByTime(ALIVE_CHECK_INTERVAL_MS)
  expect(socket.terminate).toBeCalled()
})
