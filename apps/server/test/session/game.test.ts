import dayjs from "dayjs"
import { jest } from "@jest/globals"

import Session from "../../src/game/session"
import {
  gameStartDelaySeconds,
  bestCardViewDurationSeconds
} from "../../src/game/constants"

let session: Session
const sender = {
  send() {
    //
  }
}

beforeEach(() => {
  session = new Session()
  jest.useFakeTimers()
})
afterEach(() => {
  jest.useRealTimers()
})

it("processes gameplay as expected", () => {
  const user1 = session.addUser(sender, "user1", 0, true)
  const user2 = session.addUser(sender, "user2", 0, false)
  const user3 = session.addUser(sender, "user3", 0, false)
  const user4 = session.addUser(sender, "user4", 0, false)

  session.startGame()
  expect(session.status).toBe("starting")

  jest.advanceTimersByTime(gameStartDelaySeconds * 1000)
  expect(session.status).toBe("voting")

  for (const user of session.users) {
    expect(session.getUserWhitecards(user).length).toBe(10)
  }
  expect(session.redCard).not.toBe(null)
  expect(user1.master).toBeTruthy()

  const user2whiteCard = session.getUserWhitecards(user2)[0]
  session.vote(user2, user2whiteCard)
  expect(session.votes.length).toBe(1)
  expect(session.votes[0].text).toBe(user2whiteCard)
  expect(session.votes[0].userId).toBe(user2.id)
  expect(session.votes[0].visible).toBeFalsy()

  session.vote(user3, session.getUserWhitecards(user3)[0])
  expect(session.votes.length).toBe(2)
  session.vote(user4, session.getUserWhitecards(user3)[0])
  expect(session.votes.length).toBe(3)

  expect(session.status).toBe("choosing")

  session.choose(user2.id)
  session.choose(user3.id)
  session.choose(user4.id)

  for (const vote of session.votes) {
    expect(vote.visible).toBeTruthy()
  }

  expect(session.status).toBe("choosingbest")

  session.chooseBest(user2.id)
  expect(session.status).toBe("bestcardview")

  jest.advanceTimersByTime(bestCardViewDurationSeconds * 1000)
  expect(user2.score).toBe(1)
  expect(session.votes.length).toBe(0)
  for (const user of session.users) {
    expect(user.voted).toBeFalsy()
    expect(session.getUserWhitecards(user).length).toBe(10)
  }
  expect(session.status).toBe("voting")
  expect(user2.master).toBeTruthy()
  expect(user1.master).toBeFalsy()

  user1.score = 9
  session.vote(user1, session.getUserWhitecards(user1)[0])
  session.chooseBest(session.votes[0].userId)

  jest.advanceTimersByTime(bestCardViewDurationSeconds * 1000)

  expect(session.status).toBe("end")
})

it("emits all events", async () => {
  const startingFake = jest.fn(() => {
    //
  })
  const votingFake = jest.fn(() => {
    //
  })
  const choosingFake = jest.fn(() => {
    //
  })
  const choosingBestFake = jest.fn(() => {
    //
  })
  const endFake = jest.fn(() => {
    //
  })

  session.eventBus.on("starting", startingFake)
  session.eventBus.on("voting", votingFake)
  session.eventBus.on("choosing", choosingFake)
  session.eventBus.on("choosingbest", choosingBestFake)
  session.eventBus.on("end", endFake)

  session.addUser(sender, "user1", 0, true)
  const user2 = session.addUser(sender, "user2", 0, false)
  const user3 = session.addUser(sender, "user3", 0, false)

  await session.startGame()
  expect(startingFake).toBeCalledTimes(1)

  jest.advanceTimersByTime(gameStartDelaySeconds * 1000)

  jest.useRealTimers()
  await new Promise((resolve) => setTimeout(resolve, 0))

  expect(votingFake).toBeCalledTimes(1)

  session.vote(user2, session.getUserWhitecards(user2)[0])
  session.vote(user3, session.getUserWhitecards(user3)[0])

  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(choosingFake).toBeCalledTimes(1)

  session.choose(user2.id)
  await session.choose(user3.id)
  expect(choosingBestFake).toBeCalledTimes(1)

  jest.useFakeTimers()
  session.chooseBest(user2.id)
  jest.advanceTimersByTime(bestCardViewDurationSeconds * 1000)
  jest.useRealTimers()
  await new Promise((resolve) => setTimeout(resolve, 0))

  expect(votingFake).toBeCalledTimes(2)

  await session.endGame()
  expect(endFake).toBeCalledTimes(1)
})

it("calls callbacks when choose(), vote() and choosebest() are processed", async () => {
  session.addUser(sender, "qwe", 0, true)
  const user2 = session.addUser(sender, "qwe", 0, false)
  const user3 = session.addUser(sender, "qwe", 0, false)

  session.startGame()
  jest.advanceTimersByTime(gameStartDelaySeconds * 1000)

  const onVoteFake = jest.fn()
  session.vote(user2, session.getUserWhitecards(user2)[0], {
    onVote: onVoteFake
  })
  session.vote(user3, session.getUserWhitecards(user3)[0], {
    onVote: onVoteFake
  })
  expect(onVoteFake).toBeCalledTimes(2)

  const onChooseFake = jest.fn()
  await session.choose(user2.id, { onChoose: onChooseFake })
  expect(onChooseFake).toBeCalledTimes(1)

  const onChooseBestFake = jest.fn()
  session.chooseBest(user2.id, { onChooseBest: onChooseBestFake })
  expect(onChooseBestFake).toBeCalledTimes(1)
})

it("automatically starts choosing", () => {
  session.addUser(sender, "qwe", 0, true)
  session.addUser(sender, "qwe", 0, false)
  session.addUser(sender, "qwe", 0, false)

  session.startGame()

  jest.advanceTimersByTime(gameStartDelaySeconds * 1000)
  expect(session.status).toBe("voting")

  jest.advanceTimersByTime(session.configuration.votingDurationSeconds * 1000)
  expect(session.status).toBe("choosing")
})

it("votes with a random card if user hasn't voted", () => {
  session.addUser(sender, "qwe", 0, true)
  const user2 = session.addUser(sender, "qwe", 0, false)
  session.addUser(sender, "qwe", 0, false)

  session.startGame()
  jest.advanceTimersByTime(gameStartDelaySeconds * 1000)
  jest.advanceTimersByTime(session.configuration.votingDurationSeconds * 1000)

  expect(session.getUserWhitecards(user2).length).toBe(9)
  expect(session.votes.length).toBe(2)
})

it("throws if calling choose(), chooseBest(), vote() and getUserWhiteCards() with invalid user", async () => {
  const user1 = session.addUser(sender, "qwe", 0, true)
  const fakeUser = { ...user1 }
  const user2 = session.addUser(sender, "qwe", 0, false)
  const user3 = session.addUser(sender, "qwe", 0, false)

  session.startGame()
  jest.advanceTimersByTime(gameStartDelaySeconds * 1000)
  expect(() =>
    session.vote(fakeUser, session.getUserWhitecards(user1)[0])
  ).toThrow()
  expect(() => session.getUserWhitecards(fakeUser)).toThrow()

  session.vote(user2, session.getUserWhitecards(user2)[0])
  session.vote(user3, session.getUserWhitecards(user3)[0])

  expect((async () => await session.choose("asdasdas"))()).rejects.toThrow()
  expect(() => session.chooseBest("wqeqweqwew")).toThrow()
})

it("doesn't master a disconnected user ", () => {
  const user1 = session.addUser(sender, "qwe", 0, true)
  const user2 = session.addUser(sender, "qwe", 0, false)
  const user3 = session.addUser(sender, "qwe", 0, false)
  const user4 = session.addUser(sender, "qwe", 0, false)

  session.startGame()
  session.disconnectUser(user1)

  jest.advanceTimersByTime(gameStartDelaySeconds * 1000)
  expect(user2.master).toBeTruthy()

  session.reconnectUser(sender, user1, 1)
  session.disconnectUser(user2)
  session.reconnectUser(sender, user2, 1)
  session.disconnectUser(user3)
  session.reconnectUser(sender, user3, 1)
  session.disconnectUser(user4)

  expect(user1.master).toBeTruthy()
})

it("uses configuration", () => {
  const user1 = session.addUser(sender, "qwe", 0, true)
  session.addUser(sender, "qwe", 0, false)
  session.addUser(sender, "qwe", 0, false)
  session.addUser(sender, "qwe", 0, false)

  const configuration = {
    votingDurationSeconds: 30,
    maxScore: 10,
    reader: "off"
  } as const
  session.updateConfiguration(configuration)
  expect(session.configuration).toEqual(configuration)

  session.startGame()
  jest.advanceTimersByTime(gameStartDelaySeconds * 1000)

  expect(dayjs(session.getTimeoutDate("voting")).diff(dayjs(), "s")).toBe(30)

  user1.score = 9
  session.vote(user1, session.getUserWhitecards(user1)[0])
  session.chooseBest(session.votes[0].userId)
  jest.advanceTimersByTime(bestCardViewDurationSeconds * 1000)
  expect(session.status).toBe("end")

  session.updateConfiguration({
    votingDurationSeconds: 30,
    maxScore: 15,
    reader: "off"
  })

  user1.score = 9
  session.vote(user1, session.getUserWhitecards(user1)[0])
  session.chooseBest(session.votes[0].userId)
  jest.advanceTimersByTime(bestCardViewDurationSeconds * 1000)
  expect(session.status).toBe("voting")

  user1.score = 14
  session.vote(user1, session.getUserWhitecards(user1)[0])
  session.chooseBest(session.votes[0].userId)
  jest.advanceTimersByTime(bestCardViewDurationSeconds * 1000)
  expect(session.status).toBe("end")
})
