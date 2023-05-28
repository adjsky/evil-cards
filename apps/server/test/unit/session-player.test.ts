import { jest } from "@jest/globals"
import waitForExpect from "wait-for-expect"

import Session from "../../src/game/session.ts"
import {
  GAME_START_DELAY_MS,
  SESSION_END_TIMEOUT_MS
} from "../../src/game/constants.ts"

import type { Player } from "../../src/game/types.ts"

let session: Session

beforeEach(() => {
  session = new Session()
})

describe("join", () => {
  it("joins", async () => {
    const username = "abobus"
    const avatarId = 1

    const fnMock = jest.fn((player: Player) => {
      expect(session.players.length).toBe(1)
      expect(player.avatarId).toBe(avatarId)
      expect(player.nickname).toBe(username)
      expect(player.host).toBe(true)
    })

    session.events.on("join", fnMock)
    session.join(username, avatarId)

    await waitForExpect(() => {
      expect(fnMock).toBeCalled()
    })
  })

  it("reassigns avatar if player reconnects", () => {
    session.join("1", 0)
    session.join("2", 0)
    session.join("3", 0)
    const player4 = session.join("4", 0)

    expect(player4.avatarId).toBe(0)

    session.leave(player4.id)
    const reconnectedPlayer4 = session.join("4", 4)

    expect(reconnectedPlayer4.avatarId).toBe(4)
  })

  it("reconnects players while playing", () => {
    session.join("1", 0)
    session.join("2", 0)
    session.join("3", 0)
    session.join("4", 0)

    jest.useFakeTimers()

    session.startGame(session.players[0].id)
    jest.advanceTimersByTime(GAME_START_DELAY_MS)

    session.leave(session.players[0].id)

    expect(session.players[0].disconnected).toBeTruthy()
    session.join("1", 1)
    expect(session.players[0].disconnected).toBeFalsy()

    jest.useRealTimers()

    session.endGame()
  })
})

describe("leave", () => {
  it("emits 'leave' event if there is at least one connected user", async () => {
    const fnMock = jest.fn(() => {
      //
    })

    session.events.on("leave", fnMock)

    session.join("qweqwe", 1)
    session.join("asdssd", 1)

    session.leave(session.players[0].id)

    await waitForExpect(() => {
      expect(fnMock).toBeCalled()
    })
  })

  it("deletes player if session is in waiting state", () => {
    session.join("asd", 1)
    session.join("wqe", 1)

    session.leave(session.players[0].id)

    expect(session.players.length).toBe(1)
  })

  it("marks player as disconnected if session is in playing state", () => {
    session.join("1", 1)
    session.join("2", 1)
    session.join("3", 1)
    session.join("4", 1)

    jest.useFakeTimers()

    session.startGame(session.players[0].id)
    jest.advanceTimersByTime(GAME_START_DELAY_MS)

    jest.useRealTimers()

    session.leave(session.players[1].id)

    expect(session.players[1].disconnected).toBeTruthy()

    session.endGame()
  })

  it("makes the first connected player host", () => {
    session.join("wqe", 1)
    session.join("asd", 1)

    session.leave(session.players[0].id)

    expect(session.players[0].host).toBeTruthy()
  })

  it("emits 'leave' and 'sessionend' events if the last player disconnects", async () => {
    const leaveMock = jest.fn(() => {
      //
    })
    const sessionEndMock = jest.fn(() => {
      //
    })

    session.events.on("leave", leaveMock)
    session.events.on("sessionend", sessionEndMock)

    jest.useFakeTimers()

    session.join("qweqwe", 1)
    session.join("asdssd", 1)

    session.leave(session.players[0].id)
    session.leave(session.players[0].id)

    jest.advanceTimersByTime(SESSION_END_TIMEOUT_MS)

    jest.useRealTimers()

    await waitForExpect(() => {
      expect(leaveMock).toBeCalled()
      expect(sessionEndMock).toBeCalled()
    })
  })

  it("makes the next connected player master when master player disconnects in a playing session", () => {
    session.join("1", 1)
    session.join("2", 1)
    session.join("3", 1)
    session.join("4", 1)
    session.join("5", 1)
    session.join("6", 1)

    jest.useFakeTimers()

    session.startGame(session.players[0].id)
    jest.advanceTimersByTime(GAME_START_DELAY_MS)

    jest.useRealTimers()

    session.leave(session.players[0].id)

    expect(session.players[1].master).toBeTruthy()

    session.leave(session.players[1].id)
    session.leave(session.players[2].id)

    expect(session.players[3].master).toBeTruthy()

    session.join("1", 1)
    session.join("2", 1)
    session.join("3", 1)

    session.leave(session.players[3].id)
    session.leave(session.players[4].id)
    session.leave(session.players[5].id)

    expect(session.players[0].master).toBeTruthy()

    session.endGame()
  })
})
