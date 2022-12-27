import { jest } from "@jest/globals"

import Session from "../../src/game/session"
import { GAME_START_DELAY_MS } from "../../src/game/constants"

const sender = {
  send() {
    //
  }
}
let session: Session

beforeEach(() => {
  session = new Session()
})

describe("addUser()", () => {
  it("adds user", () => {
    const username = "abobus"
    const avatarId = 1
    const host = false

    const user = session.addUser(sender, username, avatarId, host)

    expect(session.users[0]).toEqual(user)
    expect(user.avatarId).toBe(avatarId)
    expect(user.username).toBe(username)
    expect(user.host).toBe(host)
  })
})

describe("disconnectUser()", () => {
  it("calls onDisconnect with anyActivePlayers=true if there is at least one connected user", () => {
    const onDisconnectFake = jest.fn()

    const user = session.addUser(sender, "qweqwe", 1, false)
    session.addUser(sender, "qweqwe", 1, false)
    session.disconnectUser(user, {
      onDisconnect: onDisconnectFake
    })

    expect(onDisconnectFake).toBeCalledWith(true)
  })

  it("deletes user if status==waiting", () => {
    session.addUser(sender, "wqe", 1, false)
    const user = session.addUser(sender, "wqe", 1, false)

    session.disconnectUser(user)
    expect(session.users.length).toBe(1)
  })

  it("marks user as disconnected if playing", () => {
    session.addUser(sender, "wqe", 1, false)
    const user = session.addUser(sender, "wqe", 1, false)

    session.startGame()
    session.disconnectUser(user)
    expect(user.disconnected).toBeTruthy()
  })

  it("makes the first connected player host", () => {
    const user1 = session.addUser(sender, "wqe", 1, true)
    const user2 = session.addUser(sender, "wqe", 1, false)

    session.disconnectUser(user1)
    expect(user2.host).toBeTruthy()
  })

  it("calls onDisconnect with anyActivePlayers=false and onSessionEnd if last user disconnects", () => {
    const onSessionEndFake = jest.fn()
    const onDisconnectFake = jest.fn()

    const user = session.addUser(sender, "qweqwe", 1, false)
    session.disconnectUser(user, {
      onSessionEnd: onSessionEndFake,
      onDisconnect: onDisconnectFake
    })

    expect(onSessionEndFake).toBeCalledTimes(1)
    expect(onDisconnectFake).toBeCalledWith(false)
  })

  it("makes the next connected player master when master user disconnects in a playing session", () => {
    const user1 = session.addUser(sender, "wqe", 1, true)
    const user2 = session.addUser(sender, "wqe", 1, false)
    const user3 = session.addUser(sender, "wqe", 1, false)
    const user4 = session.addUser(sender, "wqe", 1, false)
    session.addUser(sender, "wqe", 1, false)
    session.addUser(sender, "wqe", 1, false)

    jest.useFakeTimers()
    session.startGame()
    jest.advanceTimersByTime(GAME_START_DELAY_MS)
    jest.useRealTimers()

    session.disconnectUser(user1)
    expect(user2.master).toBeTruthy()

    session.disconnectUser(user3)
    session.disconnectUser(user2)
    expect(user4.master).toBeTruthy()
  })

  it("emits 'end' event when one connected user remains in a playing session", async () => {
    const endCallback = jest.fn(() => {
      //
    })
    session.eventBus.on("end", endCallback)

    session.addUser(sender, "wqe", 1, true)
    const user = session.addUser(sender, "wqe", 1, false)
    session.startGame()
    session.disconnectUser(user)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(endCallback).toBeCalledTimes(1)
  })
})

describe("getUserSender()", () => {
  it("works", () => {
    const user = session.addUser(sender, "qwe", 0, true)
    const copiedUser = { ...user }

    expect(() => session.getUserSender(user)).not.toThrow()
    expect(() => session.getUserSender(copiedUser)).toThrow()
  })
})

describe("reconnectUser()", () => {
  it("should be able to reconnect user while playing", () => {
    session.addUser(sender, "adsad", 0, true)
    const user2 = session.addUser(sender, "adsad", 0, true)
    session.addUser(sender, "adsad", 0, true)

    session.startGame()
    session.disconnectUser(user2)
    expect(user2.disconnected).toBeTruthy()
    expect(() => session.reconnectUser(sender, user2, 2)).not.toThrow()
    expect(user2.avatarId).toBe(2)
    expect(user2.disconnected).toBeFalsy()
  })

  it("should not be able to reconnect a new user while playing", () => {
    session.addUser(sender, "adsad", 0, true)
    const user2 = session.addUser(sender, "adsad", 0, true)
    session.addUser(sender, "adsad", 0, true)

    session.startGame()
    session.disconnectUser(user2)
    expect(() => session.reconnectUser(sender, { ...user2 }, 2)).toThrow()
    expect(user2.disconnected).toBeTruthy()
  })
})
