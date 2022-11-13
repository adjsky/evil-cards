import t from "tap"
import sinon, { SinonFakeTimers } from "sinon"
import esmock from "esmock"
import dayjs from "dayjs"

import Session from "../../src/game/session"

let session: Session
let clock: SinonFakeTimers
const sender = {
  send() {
    //
  }
}

t.beforeEach(() => {
  session = new Session()
  clock = sinon.useFakeTimers()
})
t.afterEach(() => {
  clock.restore()
})

t.test("session creates with random id provided by nanoid", async (t) => {
  const plannedId = "LOH"
  const MockedSession = await esmock("../../src/game/session", {
    nanoid: {
      nanoid: () => plannedId
    }
  })

  const newSession = new MockedSession()
  t.equal(newSession.id, plannedId)

  t.end()
})

t.test("main workflow should work as expected", async (t) => {
  const user1 = session.addUser(sender, "user1", 0, true)
  const user2 = session.addUser(sender, "user2", 0, false)
  const user3 = session.addUser(sender, "user3", 0, false)
  const user4 = session.addUser(sender, "user4", 0, false)

  session.startGame()

  t.equal(session.status, "starting")

  clock.tick(3000)

  t.equal(session.status, "voting")
  for (const user of session.users) {
    t.equal(session.getUserWhitecards(user).length, 10)
  }
  t.not(session.redCard, null)
  t.ok(user1.master)

  const user2whiteCard = session.getUserWhitecards(user2)[0]
  t.ok(user2whiteCard)

  session.vote(user2, user2whiteCard)
  t.equal(session.votes.length, 1)
  const firstVote = session.votes[0]
  t.ok(firstVote)
  t.equal(firstVote.text, user2whiteCard)
  t.equal(firstVote.userId, user2.id)
  t.equal(firstVote.visible, false)

  const user3WhiteCard = session.getUserWhitecards(user3)[0]
  t.ok(user3WhiteCard)
  session.vote(user3, user3WhiteCard)
  t.equal(session.votes.length, 2)
  const user4WhiteCard = session.getUserWhitecards(user3)[0]
  t.ok(user4WhiteCard)
  session.vote(user4, user4WhiteCard)
  t.equal(session.votes.length, 3)

  t.equal(session.status, "choosing")
  session.choose(user2.id)
  t.equal(firstVote.visible, true)
  session.choose(user3.id)
  session.choose(user4.id)

  t.equal(session.status, "choosingbest")
  session.chooseBest(user2.id)
  t.equal(user2.score, 1)
  t.equal(session.votes.length, 0)
  for (const user of session.users) {
    t.notOk(user.voted)
    t.equal(session.getUserWhitecards(user).length, 10)
  }
  t.equal(session.status, "voting")
  t.ok(user2.master)
  t.notOk(user1.master)

  user1.score = 9
  session.vote(user1, session.getUserWhitecards(user1)[0])
  session.chooseBest(session.votes[0].userId)

  t.equal(session.status, "end")

  t.end()
})

t.test("all events are emitted", async (t) => {
  const startingFake = sinon.fake()
  const votingFake = sinon.fake()
  const choosingFake = sinon.fake()
  const choosingBestFake = sinon.fake()
  const endFake = sinon.fake()

  session.eventBus.on("starting", startingFake)
  session.eventBus.on("voting", votingFake)
  session.eventBus.on("choosing", choosingFake)
  session.eventBus.on("choosingbest", choosingBestFake)
  session.eventBus.on("end", endFake)

  session.addUser(sender, "user1", 0, true)
  const user2 = session.addUser(sender, "user2", 0, false)
  const user3 = session.addUser(sender, "user3", 0, false)

  await session.startGame()
  t.ok(startingFake.calledOnce)

  clock.tick(3000)
  clock.restore()

  await new Promise((resolve) => setTimeout(resolve, 0))

  t.ok(votingFake.calledOnce)

  session.vote(user2, session.getUserWhitecards(user2)[0])
  session.vote(user3, session.getUserWhitecards(user3)[0])

  await new Promise((resolve) => setTimeout(resolve, 0))
  t.ok(choosingFake.calledOnce)

  session.choose(user2.id)
  await session.choose(user3.id)
  t.ok(choosingBestFake.calledOnce)

  session.chooseBest(user2.id)
  await new Promise((resolve) => setTimeout(resolve, 0))
  t.ok(votingFake.calledTwice)

  await session.endGame()
  t.ok(endFake.calledOnce)

  session.endGame()
  session.eventBus.off("starting", startingFake)
  session.eventBus.off("voting", votingFake)
  session.eventBus.off("choosing", choosingFake)
  session.eventBus.off("choosingbest", choosingBestFake)
  session.eventBus.off("end", endFake)
  t.end()
})

t.test("choose() and vote() calls callback", async (t) => {
  session.addUser(sender, "qwe", 0, true)
  const user2 = session.addUser(sender, "qwe", 0, false)
  const user3 = session.addUser(sender, "qwe", 0, false)

  session.startGame()
  clock.tick(3000)

  const onVoteFake = sinon.fake()
  session.vote(user2, session.getUserWhitecards(user2)[0], {
    onVote: onVoteFake
  })
  session.vote(user3, session.getUserWhitecards(user3)[0], {
    onVote: onVoteFake
  })
  t.ok(onVoteFake.calledTwice)

  const onChooseFake = sinon.fake()
  await session.choose(user2.id, { onChoose: onChooseFake })
  t.ok(onChooseFake.calledOnce)
  t.end()
})

t.test("automatically starts choosing", (t) => {
  session.addUser(sender, "qwe", 0, true)
  session.addUser(sender, "qwe", 0, false)
  session.addUser(sender, "qwe", 0, false)

  session.startGame()
  clock.tick(3000)
  t.equal(session.status, "voting")
  clock.tick(60000)
  t.equal(session.status, "choosing")
  t.end()
})

t.test(
  "should automatically take away white card if user hasn't voted",
  (t) => {
    session.addUser(sender, "qwe", 0, true)
    const user2 = session.addUser(sender, "qwe", 0, false)
    session.addUser(sender, "qwe", 0, false)

    session.startGame()
    clock.tick(3000)
    clock.tick(60000)

    t.equal(session.getUserWhitecards(user2).length, 9)
    t.equal(session.votes.length, 2)

    t.end()
  }
)

t.test(
  "choose, chooseBest, vote and getUserWihteCards should throw if invalid user passed",
  async (t) => {
    const user1 = session.addUser(sender, "qwe", 0, true)
    const fakeUser = { ...user1 }
    const user2 = session.addUser(sender, "qwe", 0, false)
    const user3 = session.addUser(sender, "qwe", 0, false)

    session.startGame()
    clock.tick(3000)
    t.throws(() => session.vote(fakeUser, session.getUserWhitecards(user1)[0]))
    t.throws(() => session.getUserWhitecards(fakeUser))

    session.vote(user2, session.getUserWhitecards(user2)[0])
    session.vote(user3, session.getUserWhitecards(user3)[0])

    t.rejects(async () => await session.choose("asdasdas"))
    t.throws(() => session.chooseBest("wqeqweqwew"))

    t.end()
  }
)

t.test("should process disconnected users when choosing master", (t) => {
  const user1 = session.addUser(sender, "qwe", 0, true)
  const user2 = session.addUser(sender, "qwe", 0, false)
  const user3 = session.addUser(sender, "qwe", 0, false)
  const user4 = session.addUser(sender, "qwe", 0, false)

  session.startGame()
  session.disconnectUser(user1)

  clock.tick(3000)

  t.ok(user2.master)

  session.reconnectUser(sender, user1, 1)
  session.disconnectUser(user2)
  session.reconnectUser(sender, user2, 1)
  session.disconnectUser(user3)
  session.reconnectUser(sender, user3, 1)
  session.disconnectUser(user4)

  t.ok(user1.master)

  t.end()
})

t.test("configuration", (t) => {
  const user1 = session.addUser(sender, "qwe", 0, true)
  session.addUser(sender, "qwe", 0, false)
  session.addUser(sender, "qwe", 0, false)
  session.addUser(sender, "qwe", 0, false)

  const configuration = {
    votingDuration: 30,
    maxScore: 10,
    reader: "off"
  } as const
  session.updateConfiguration(configuration)
  t.same(session.configuration, configuration)

  session.startGame()
  clock.tick(3000)

  t.equal(dayjs(session.getTimeoutDate("voting")).diff(dayjs(), "s"), 30)

  user1.score = 9
  session.vote(user1, session.getUserWhitecards(user1)[0])
  session.chooseBest(session.votes[0].userId)

  t.equal(session.status, "end")

  session.updateConfiguration({
    votingDuration: 30,
    maxScore: 15,
    reader: "off"
  })

  user1.score = 9
  session.vote(user1, session.getUserWhitecards(user1)[0])
  session.chooseBest(session.votes[0].userId)

  t.equal(session.status, "voting")
  user1.score = 14
  session.vote(user1, session.getUserWhitecards(user1)[0])
  session.chooseBest(session.votes[0].userId)

  t.equal(session.status, "end")

  t.end()
})
