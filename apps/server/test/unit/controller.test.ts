import { jest } from "@jest/globals"
import { ALIVE_CHECK_INTERVAL_MS } from "../../src/game/constants"
import { mock } from "jest-mock-extended"
import waitForExpect from "wait-for-expect"

import type { ISessionManager } from "../../src/game/intefaces"
import type { RedisClientWithLogs } from "../../src/redis-client-with-logs"
import type { FastifyBaseLogger } from "fastify"
import type { ReqContext } from "../../src/context"

jest.unstable_mockModule(
  "ws",
  async () => await import("../config/mocked-web-socket")
)

const Controller = (await import("../../src/game/controller")).default
const WebSocket = (await import("ws")).default

function getMockLog() {
  return mock<FastifyBaseLogger>({
    child: getMockLog
  })
}

const sessionManager = mock<ISessionManager>()
const redisClient = mock<RedisClientWithLogs>()
const log = getMockLog()
const ctx = mock<ReqContext>()

it("terminates connection after two failed pings", async () => {
  const controller = new Controller(
    sessionManager,
    redisClient,
    {
      serverNumber: "1"
    },
    log
  )
  const socket = new WebSocket("")

  jest.useFakeTimers()

  controller.handleConnection(ctx, socket)

  jest.advanceTimersByTime(ALIVE_CHECK_INTERVAL_MS)
  expect(socket.terminate).not.toBeCalled()

  jest.advanceTimersByTime(ALIVE_CHECK_INTERVAL_MS)

  jest.useRealTimers()

  await waitForExpect(() => {
    expect(socket.terminate).toBeCalled()
  })
})
