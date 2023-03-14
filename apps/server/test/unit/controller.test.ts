import { jest } from "@jest/globals"
import { ALIVE_CHECK_INTERVAL_MS } from "../../src/game/constants"
import { mock } from "jest-mock-extended"
import waitForExpect from "wait-for-expect"

import type { ISessionManager } from "../../src/game/intefaces"

jest.unstable_mockModule(
  "ws",
  async () => await import("../config/mocked-web-socket")
)

const Controller = (await import("../../src/game/controller")).default
const WebSocket = (await import("ws")).default

const sessionManager = mock<ISessionManager>()

it("terminates connection after two failed pings", async () => {
  const controller = new Controller(sessionManager)
  const socket = new WebSocket("")

  jest.useFakeTimers()

  controller.handleConnection(socket)

  jest.advanceTimersByTime(ALIVE_CHECK_INTERVAL_MS)
  expect(socket.terminate).not.toBeCalled()

  jest.advanceTimersByTime(ALIVE_CHECK_INTERVAL_MS)

  jest.useRealTimers()

  await waitForExpect(() => {
    expect(socket.terminate).toBeCalled()
  })
})
