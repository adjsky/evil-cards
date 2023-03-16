import { jest } from "@jest/globals"
import { ALIVE_CHECK_INTERVAL_MS } from "../../src/game/constants"
import { mock } from "jest-mock-extended"
import waitForExpect from "wait-for-expect"

import type { ISessionManager } from "../../src/game/intefaces"
import type { RedisClientType } from "redis"
import type { FastifyBaseLogger } from "fastify"

jest.unstable_mockModule(
  "ws",
  async () => await import("../config/mocked-web-socket")
)

const Controller = (await import("../../src/game/controller")).default
const WebSocket = (await import("ws")).default

const sessionManager = mock<ISessionManager>()
const redis = mock<RedisClientType>()
const log = mock<FastifyBaseLogger>({
  child: () => mock<FastifyBaseLogger>()
})

it("terminates connection after two failed pings", async () => {
  const controller = new Controller(
    sessionManager,
    redis,
    {
      serverNumber: "1"
    },
    log
  )
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
