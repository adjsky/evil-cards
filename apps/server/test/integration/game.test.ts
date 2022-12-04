import { jest } from "@jest/globals"

jest.unstable_mockModule(
  "ws",
  async () => await import("../config/mocked-web-socket")
)

const game = (await import("../../src/game")).default
const WebSocket = (await import("ws")).default

beforeEach(() => {
  jest.useFakeTimers()
})
afterEach(() => {
  jest.useRealTimers()
})

it("doesn't allow to create session twice", async () => {
  const socket = new WebSocket("")

  const createSession = async () =>
    await game.controller.eventBus.emit("createsession", {
      avatarId: 1,
      username: "",
      socket
    })

  await createSession()
  expect(createSession).rejects.toThrow()
})
