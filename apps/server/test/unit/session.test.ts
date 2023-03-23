import dayjs from "dayjs"
import { jest } from "@jest/globals"
import waitForExpect from "wait-for-expect"

import Session from "../../src/game/session"
import {
  GAME_START_DELAY_MS,
  BEST_CARD_VIEW_DURATION_MS
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
  session.join(sender, "user1", 0, true)
  session.join(sender, "user2", 0, false)
  session.join(sender, "user3", 0, false)
  session.join(sender, "user4", 0, false)

  const firstPlayer = session.players[0]

  session.startGame(firstPlayer.id)
  expect(session.status).toBe("starting")

  jest.advanceTimersByTime(GAME_START_DELAY_MS)
  expect(session.status).toBe("voting")

  session.players.forEach((player) => {
    expect(player.deck.length).toBe(10)
  })

  expect(session.redCard).not.toBe(null)
  expect(firstPlayer.master).toBeTruthy()

  const secondPlayer = session.players[1]
  const secondPlayerWhiteCard = secondPlayer.deck[0]
  session.vote(secondPlayer.id, secondPlayerWhiteCard.id)

  expect(session.votes.length).toBe(1)
  expect(session.votes[0].text).toBe(secondPlayerWhiteCard.text)
  expect(session.votes[0].playerId).toBe(secondPlayer.id)
  expect(session.votes[0].visible).toBeFalsy()

  const thirdPlayer = session.players[2]
  const fourthPlayer = session.players[3]

  session.vote(thirdPlayer.id, thirdPlayer.deck[0].id)
  expect(session.votes.length).toBe(2)
  session.vote(fourthPlayer.id, fourthPlayer.deck[0].id)
  expect(session.votes.length).toBe(3)

  expect(session.status).toBe("choosing")

  session.choose(firstPlayer.id, secondPlayer.id)
  session.choose(firstPlayer.id, thirdPlayer.id)
  session.choose(firstPlayer.id, fourthPlayer.id)

  session.votes.forEach((vote) => {
    expect(vote.visible).toBeTruthy()
  })

  expect(session.status).toBe("choosingwinner")

  session.chooseWinner(firstPlayer.id, secondPlayer.id)
  expect(session.status).toBe("winnercardview")

  jest.advanceTimersByTime(BEST_CARD_VIEW_DURATION_MS)

  expect(secondPlayer.score).toBe(1)
  expect(session.votes.length).toBe(0)

  session.players.forEach((player) => {
    expect(player.voted).toBeFalsy()
    expect(player.deck.length).toBe(10)
  })

  expect(session.status).toBe("voting")
  expect(secondPlayer.master).toBeTruthy()
  expect(firstPlayer.master).toBeFalsy()

  firstPlayer.score = 9

  session.vote(firstPlayer.id, firstPlayer.deck[0].id)
  session.vote(thirdPlayer.id, thirdPlayer.deck[0].id)
  session.vote(fourthPlayer.id, fourthPlayer.deck[0].id)

  session.choose(secondPlayer.id, firstPlayer.id)
  session.choose(secondPlayer.id, thirdPlayer.id)
  session.choose(secondPlayer.id, fourthPlayer.id)

  session.chooseWinner(secondPlayer.id, firstPlayer.id)

  jest.advanceTimersByTime(BEST_CARD_VIEW_DURATION_MS)

  expect(session.status).toBe("end")
})

it("emits all events", async () => {
  const leaveMock = jest.fn(() => {
    //
  })
  const joinMock = jest.fn(() => {
    //
  })
  const chooseMock = jest.fn(() => {
    //
  })
  const chooseWinnerMock = jest.fn(() => {
    //
  })
  const configurationChangeMock = jest.fn(() => {
    //
  })
  const sessionEndMock = jest.fn(() => {
    //
  })
  const statusChangeMock = jest.fn(() => {
    //
  })
  const voteMock = jest.fn(() => {
    //
  })

  session.events.on("choose", chooseMock)
  session.events.on("choosewinner", chooseWinnerMock)
  session.events.on("configurationchange", configurationChangeMock)
  session.events.on("join", joinMock)
  session.events.on("leave", leaveMock)
  session.events.on("sessionend", sessionEndMock)
  session.events.on("statuschange", statusChangeMock)
  session.events.on("vote", voteMock)

  session.join(sender, "user1", 0, true)
  session.join(sender, "user2", 0, false)
  session.join(sender, "user3", 0, false)
  session.join(sender, "user4", 0, false)

  const firstPlayer = session.players[0]
  const secondPlayer = session.players[1]
  const thirdPlayer = session.players[2]
  const fourthPlayer = session.players[3]

  session.startGame(firstPlayer.id)

  jest.advanceTimersByTime(GAME_START_DELAY_MS)

  session.vote(secondPlayer.id, secondPlayer.deck[0].id)
  session.vote(thirdPlayer.id, thirdPlayer.deck[0].id)
  session.vote(fourthPlayer.id, fourthPlayer.deck[0].id)

  session.choose(firstPlayer.id, secondPlayer.id)
  session.choose(firstPlayer.id, thirdPlayer.id)
  session.choose(firstPlayer.id, fourthPlayer.id)

  session.chooseWinner(firstPlayer.id, secondPlayer.id)

  session.endGame()

  jest.useRealTimers()
  await waitForExpect(() => {
    expect(statusChangeMock).toBeCalledWith("starting")
    expect(statusChangeMock).toBeCalledWith("end")
    expect(chooseWinnerMock).toBeCalledTimes(1)
    expect(chooseMock).toBeCalledTimes(3)
    expect(statusChangeMock).toBeCalledWith("choosing")
    expect(voteMock).toBeCalledTimes(3)
    expect(statusChangeMock).toBeCalledWith("voting")
  })

  session.events.clearListeners()
})

it("automatically starts choosing", () => {
  session.join(sender, "1", 0, true)
  session.join(sender, "2", 0, false)
  session.join(sender, "3", 0, false)

  session.startGame(session.players[0].id)

  jest.advanceTimersByTime(GAME_START_DELAY_MS)
  expect(session.status).toBe("voting")

  jest.advanceTimersByTime(session.configuration.votingDurationSeconds * 1000)
  expect(session.status).toBe("choosing")

  session.endGame()
})

it("votes with a random card if user didn't vote", () => {
  session.join(sender, "1", 0, true)
  session.join(sender, "2", 0, false)
  session.join(sender, "3", 0, false)

  session.startGame(session.players[0].id)

  jest.advanceTimersByTime(GAME_START_DELAY_MS)
  jest.advanceTimersByTime(session.configuration.votingDurationSeconds * 1000)

  expect(session.players[1].deck.length).toBe(9)
  expect(session.players[2].deck.length).toBe(9)
  expect(session.votes.length).toBe(2)

  session.endGame()
})

it("doesn't master a disconnected user", () => {
  session.join(sender, "1", 0, true)
  session.join(sender, "2", 0, false)
  session.join(sender, "3", 0, false)
  session.join(sender, "4", 0, false)
  session.join(sender, "5", 0, false)

  session.startGame(session.players[0].id)
  jest.advanceTimersByTime(GAME_START_DELAY_MS)

  session.leave(session.players[1].id)
  session.leave(session.players[0].id)

  expect(session.players[1].master).toBeFalsy()
  expect(session.players[2].master).toBeTruthy()

  session.endGame()
})

it("uses configuration", () => {
  session.join(sender, "1", 0, true)
  session.join(sender, "2", 0, false)
  session.join(sender, "3", 0, false)

  const firstPlayer = session.players[0]
  const secondPlayer = session.players[1]
  const thirdPlayer = session.players[2]

  const configuration = {
    votingDurationSeconds: 30,
    maxScore: 10,
    reader: false,
    version18Plus: true
  } as const
  session.updateConfiguration(firstPlayer.id, configuration)
  expect(session.configuration).toEqual(configuration)

  session.startGame(firstPlayer.id)
  jest.advanceTimersByTime(GAME_START_DELAY_MS)

  expect(dayjs(session.getTimeoutDate("voting")).diff(dayjs(), "s")).toBe(
    configuration.votingDurationSeconds
  )

  secondPlayer.score = configuration.maxScore - 1

  session.vote(secondPlayer.id, secondPlayer.deck[0].id)
  session.vote(thirdPlayer.id, thirdPlayer.deck[0].id)

  session.choose(firstPlayer.id, secondPlayer.id)
  session.choose(firstPlayer.id, thirdPlayer.id)

  session.chooseWinner(firstPlayer.id, secondPlayer.id)
  jest.advanceTimersByTime(BEST_CARD_VIEW_DURATION_MS)

  expect(session.status).toBe("end")
})
