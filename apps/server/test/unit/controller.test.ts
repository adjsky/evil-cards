import { jest } from "@jest/globals"
import { msAliveCheckInterval } from "../../src/game/constants"

jest.unstable_mockModule(
  "ws",
  async () => await import("../config/mocked-web-socket")
)

const Controller = (await import("../../src/game/controller")).default
const WebSocket = (await import("ws")).default

it("terminates connection after two failed pings", () => {
  const controller = new Controller()
  const socket = new WebSocket("")

  jest.useFakeTimers()

  controller.handleConnection(socket)

  jest.advanceTimersByTime(msAliveCheckInterval)
  expect(socket.terminate).not.toBeCalled()

  jest.advanceTimersByTime(msAliveCheckInterval)
  expect(socket.terminate).toBeCalled()
})
