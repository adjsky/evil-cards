import { jest } from "@jest/globals"
import { ALIVE_CHECK_INTERVAL_MS } from "../../src/game/constants.ts"
import { mock } from "jest-mock-extended"
import waitForExpect from "wait-for-expect"
import SessionManager from "../../src/game/session-manager.ts"
import { SessionFactory } from "../../src/game/session.ts"

import type { RedisClientWithLogs } from "@evil-cards/redis/client-with-logs"
import type { FastifyBaseLogger } from "fastify"
import type { ReqContext } from "@evil-cards/ctx-log"

jest.unstable_mockModule(
  "ws",
  async () => await import("../config/mocked-web-socket.ts")
)

const Controller = (await import("../../src/game/controller.ts")).default
const WebSocket = (await import("ws")).default

function getMockLog() {
  return mock<FastifyBaseLogger>({
    child: getMockLog
  })
}

function getRedisClientWithLogs() {
  return mock<RedisClientWithLogs>({
    hDel() {
      return Promise.resolve(1)
    },
    hSet() {
      return Promise.resolve(1)
    },
    withContext: getRedisClientWithLogs
  })
}

const sessionManager = new SessionManager(new SessionFactory())
const redisClient = getRedisClientWithLogs()
const log = getMockLog()
const ctx = mock<ReqContext>()

afterEach(() => {
  jest.useRealTimers()
})

it("terminates connection after two failed pings", async () => {
  const controller = new Controller(
    sessionManager,
    redisClient,
    {
      serverNumber: 1
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

it("checks app and session versions", async () => {
  const controller = new Controller(
    sessionManager,
    redisClient,
    {
      serverNumber: 1
    },
    log
  )

  jest.useFakeTimers()

  const socket = new WebSocket("")
  controller.handleConnection(ctx, socket)

  jest.useRealTimers()

  socket.emit(
    "message",
    JSON.stringify({
      type: "createsession",
      details: {
        nickname: "qwe",
        avatarId: 4,
        appVersion: "0.1.0"
      }
    })
  )

  let sessionId = ""

  await waitForExpect(() => {
    expect(socket.send).toBeCalledTimes(1)

    const sendMock = socket.send as jest.Mock
    const data = JSON.parse(sendMock.mock.calls[0][0] as string)

    expect(data).toEqual(
      expect.objectContaining({
        type: "create"
      })
    )

    sessionId = data.details.changedState.id
  })

  jest.useFakeTimers()

  const joinSocket = new WebSocket("")
  controller.handleConnection(ctx, joinSocket)

  jest.useRealTimers()

  joinSocket.emit(
    "message",
    JSON.stringify({
      type: "joinsession",
      details: {
        nickname: "qwe",
        avatarId: 4,
        appVersion: "1.0.0",
        sessionId
      }
    })
  )

  await waitForExpect(() => {
    expect(joinSocket.send).toBeCalledTimes(1)

    const sendMock = joinSocket.send as jest.Mock
    expect(JSON.parse(sendMock.mock.calls[0][0] as string)).toEqual(
      expect.objectContaining({
        type: "error"
      })
    )
  })

  joinSocket.emit(
    "message",
    JSON.stringify({
      type: "joinsession",
      details: {
        nickname: "qwee",
        avatarId: 4,
        appVersion: "0.1.0",
        sessionId
      }
    })
  )

  await waitForExpect(() => {
    expect(joinSocket.send).toBeCalledTimes(2)

    const sendMock = joinSocket.send as jest.Mock
    expect(JSON.parse(sendMock.mock.calls[1][0] as string)).toEqual(
      expect.objectContaining({
        type: "join"
      })
    )
  })
})
