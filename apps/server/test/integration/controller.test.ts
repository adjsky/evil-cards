import { jest } from "@jest/globals"

jest.unstable_mockModule(
  "ws",
  async () => await import("../config/mocked-web-socket")
)

const Controller = (await import("../../src/game/controller")).default
const WebSocket = (await import("ws")).default

it("works", () => {
  jest.useFakeTimers()
  const controller = new Controller()

  const socket = new WebSocket("")
  controller.handleConnection(socket)
})
