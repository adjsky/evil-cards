import t from "tap"
import sinon from "sinon"

import BufferedSender from "../helpers/buffered-sender"
import Session from "../../session"

const bufferedSender = new BufferedSender(true)
let session = new Session()

t.afterEach(() => {
  session = new Session()
})

t.test("adds user", (t) => {
  t.plan(4)

  const username = "abobus"
  const avatarId = 1
  const host = false

  const user = session.addUser(bufferedSender, username, avatarId, host)

  t.equal(session.users[0], user)
  t.equal(user.avatarId, avatarId)
  t.equal(user.username, username)
  t.equal(user.host, host)
})

t.test("disconnectUser calls onDisconnect", (t) => {
  t.plan(1)

  const onDisconnectFake = sinon.fake()

  const user = session.addUser(bufferedSender, "qweqwe", 1, false)
  session.disconnectUser(user, {
    onDisconnect: onDisconnectFake
  })

  t.ok(onDisconnectFake.calledOnce)
})

t.test(
  "disconnectUser calls onDisconnect with anyActivePlayers=true if there is at least one connected user",
  (t) => {
    t.plan(1)

    const onDisconnectFake = sinon.fake()

    const user = session.addUser(bufferedSender, "qweqwe", 1, false)
    session.addUser(bufferedSender, "qweqwe", 1, false)
    session.disconnectUser(user, {
      onDisconnect: onDisconnectFake
    })

    t.ok(onDisconnectFake.calledWithExactly(true))
  }
)

t.test(
  "if last user disconnects onSessionEnd is called, onDisconnect is called with anyActivePlayers=false",
  (t) => {
    t.plan(2)

    const onSessionEndFake = sinon.fake()
    const onDisconnectFake = sinon.fake()

    const user = session.addUser(bufferedSender, "qweqwe", 1, false)
    session.disconnectUser(user, {
      onSessionEnd: onSessionEndFake,
      onDisconnect: onDisconnectFake
    })

    t.ok(onSessionEndFake.calledOnce)
    t.ok(onDisconnectFake.calledOnceWithExactly(false))
  }
)

t.test("disconnectUser deletes user if status==waiting", (t) => {
  t.plan(1)

  session.addUser(bufferedSender, "wqe", 1, false)
  const user = session.addUser(bufferedSender, "wqe", 1, false)

  session.disconnectUser(user)
  t.equal(session.users.length, 1)
})

t.test("disconnectUser marks user as disconnected if playing", (t) => {
  session.addUser(bufferedSender, "wqe", 1, false)
  const user = session.addUser(bufferedSender, "wqe", 1, false)

  session.startVoting()
  session.disconnectUser(user)
  t.ok(user.disconnected)

  session.endGame()
  t.end()
})

t.test("if host disconnects the first connected player becomes host", (t) => {
  t.plan(1)

  const user1 = session.addUser(bufferedSender, "wqe", 1, true)
  const user2 = session.addUser(bufferedSender, "wqe", 1, false)
  session.disconnectUser(user1)

  t.ok(user2.host)
})

t.test(
  "if playing and after disconnection one connected user remains 'end' event is emitted",
  async (t) => {
    const endCallback = sinon.fake()
    session.eventBus.on("end", endCallback)

    session.addUser(bufferedSender, "wqe", 1, true)
    const user = session.addUser(bufferedSender, "wqe", 1, false)

    session.startVoting()
    session.disconnectUser(user)

    await new Promise((resolve) => setTimeout(resolve, 0))

    t.ok(endCallback.calledOnce)

    session.endGame()
    session.eventBus.off("end", endCallback)
    t.end()
  }
)

t.test(
  "if playing the next player should become master on disconnection if disconnected user was master",
  (t) => {
    const user1 = session.addUser(bufferedSender, "wqe", 1, true)
    const user2 = session.addUser(bufferedSender, "wqe", 1, false)
    session.addUser(bufferedSender, "wqe", 1, false)

    session.startVoting()
    session.disconnectUser(user1)

    t.ok(user2.master)

    session.endGame()
    t.end()
  }
)
