import { fromPartial } from "@total-typescript/shoehorn"
import { afterEach, expect, it, vi } from "vitest"
import { mock } from "vitest-mock-extended"
import waitForExpect from "wait-for-expect"
import WebSocket from "ws"

import { ALIVE_CHECK_INTERVAL_MS } from "../../src/game/constants.ts"
import Controller from "../../src/game/controller.ts"
import SessionManager from "../../src/game/session-manager.ts"
import { SessionFactory } from "../../src/game/session.ts"

import type { RedisClient } from "@evil-cards/core/keydb"
import type { Mock } from "vitest"

vi.mock("ws", async () => import("../config/mocked-web-socket.ts"))
vi.mock("@evil-cards/core/fastify", () => import("../config/core-fastify.ts"))

function getCacheClient() {
  return mock<RedisClient>({
    hDel() {
      return Promise.resolve(1)
    },
    hSet() {
      return Promise.resolve(1)
    },
    hGetAll() {
      return Promise.resolve({})
    },
    multi() {
      return fromPartial<ReturnType<RedisClient["multi"]>>({
        exec() {
          return Promise.resolve(["1", "1"])
        },
        hSet() {
          return fromPartial(this)
        },
        addCommand() {
          return fromPartial(this)
        }
      })
    }
  })
}

const sessionManager = new SessionManager(new SessionFactory())
const cacheClient = getCacheClient()

afterEach(() => {
  vi.useRealTimers()
})

it("terminates connection after two failed pings", async () => {
  const controller = new Controller(sessionManager, cacheClient, {
    serverNumber: 1
  })
  const socket = new WebSocket("")

  vi.useFakeTimers()

  controller.handleConnection(socket)

  vi.advanceTimersByTime(ALIVE_CHECK_INTERVAL_MS)
  expect(socket.terminate).not.toBeCalled()

  vi.advanceTimersByTime(ALIVE_CHECK_INTERVAL_MS)

  vi.useRealTimers()

  await waitForExpect(() => {
    expect(socket.terminate).toBeCalled()
  })
})

it("checks app and session versions", async () => {
  const controller = new Controller(sessionManager, cacheClient, {
    serverNumber: 1
  })

  vi.useFakeTimers()

  const socket = new WebSocket("")
  controller.handleConnection(socket)

  vi.useRealTimers()

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

    const sendMock = socket.send as Mock
    const data = JSON.parse(sendMock.mock.calls[0][0] as string)

    expect(data).toEqual(
      expect.objectContaining({
        type: "create"
      })
    )

    sessionId = data.details.changedState.id
  })

  vi.useFakeTimers()

  const joinSocket = new WebSocket("")
  controller.handleConnection(joinSocket)

  vi.useRealTimers()

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

    const sendMock = joinSocket.send as Mock
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

    const sendMock = joinSocket.send as Mock
    expect(JSON.parse(sendMock.mock.calls[1][0] as string)).toEqual(
      expect.objectContaining({
        type: "join"
      })
    )
  })
})
