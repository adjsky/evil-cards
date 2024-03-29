import dayjs from "dayjs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import waitForExpect from "wait-for-expect"

import {
  BEST_CARD_VIEW_DURATION_MS,
  GAME_START_DELAY_MS,
  LEAVE_TIMEOUT_MS
} from "../../src/game/constants.ts"
import Session from "../../src/game/session.ts"

let session: Session

beforeEach(() => {
  session = new Session()
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe("regular gameplay", () => {
  it("processes gameplay as expected", () => {
    session.join("user1", 0)
    session.join("user2", 0)
    session.join("user3", 0)
    session.join("user4", 0)

    const firstPlayer = session.players[0]

    session.startGame(firstPlayer.id)
    expect(session.status).toBe("starting")

    vi.advanceTimersByTime(GAME_START_DELAY_MS)
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

    vi.advanceTimersByTime(BEST_CARD_VIEW_DURATION_MS)

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

    vi.advanceTimersByTime(BEST_CARD_VIEW_DURATION_MS)

    expect(session.status).toBe("end")
  })

  it("emits all events", async () => {
    const leaveMock = vi.fn(() => {
      //
    })
    const joinMock = vi.fn(() => {
      //
    })
    const chooseMock = vi.fn(() => {
      //
    })
    const chooseWinnerMock = vi.fn(() => {
      //
    })
    const configurationChangeMock = vi.fn(() => {
      //
    })
    const sessionEndMock = vi.fn(() => {
      //
    })
    const statusChangeMock = vi.fn(() => {
      //
    })
    const voteMock = vi.fn(() => {
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

    session.join("user1", 0)
    session.join("user2", 0)
    session.join("user3", 0)
    session.join("user4", 0)

    const firstPlayer = session.players[0]
    const secondPlayer = session.players[1]
    const thirdPlayer = session.players[2]
    const fourthPlayer = session.players[3]

    session.startGame(firstPlayer.id)

    vi.advanceTimersByTime(GAME_START_DELAY_MS)

    session.vote(secondPlayer.id, secondPlayer.deck[0].id)
    session.vote(thirdPlayer.id, thirdPlayer.deck[0].id)
    session.vote(fourthPlayer.id, fourthPlayer.deck[0].id)

    session.choose(firstPlayer.id, secondPlayer.id)
    session.choose(firstPlayer.id, thirdPlayer.id)
    session.choose(firstPlayer.id, fourthPlayer.id)

    session.chooseWinner(firstPlayer.id, secondPlayer.id)

    session.endGame()

    vi.useRealTimers()
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
    session.join("1", 0)
    session.join("2", 0)
    session.join("3", 0)

    session.startGame(session.players[0].id)

    vi.advanceTimersByTime(GAME_START_DELAY_MS)
    expect(session.status).toBe("voting")

    vi.advanceTimersByTime(session.configuration.votingDurationSeconds * 1000)
    expect(session.status).toBe("choosing")

    session.endGame()
  })

  it("votes with a random card if user didn't vote", () => {
    session.join("1", 0)
    session.join("2", 0)
    session.join("3", 0)

    session.startGame(session.players[0].id)

    vi.advanceTimersByTime(GAME_START_DELAY_MS)
    vi.advanceTimersByTime(session.configuration.votingDurationSeconds * 1000)

    expect(session.players[1].deck.length).toBe(9)
    expect(session.players[2].deck.length).toBe(9)
    expect(session.votes.length).toBe(2)

    session.endGame()
  })

  it("doesn't master a disconnected user", () => {
    session.join("1", 0)
    session.join("2", 0)
    session.join("3", 0)
    session.join("4", 0)
    session.join("5", 0)

    session.startGame(session.players[0].id)
    vi.advanceTimersByTime(GAME_START_DELAY_MS)

    session.leave(session.players[1].id)
    session.leave(session.players[0].id)
    vi.advanceTimersByTime(LEAVE_TIMEOUT_MS)

    expect(session.players[1].master).toBeFalsy()
    expect(session.players[2].master).toBeTruthy()

    session.endGame()
  })

  it("uses configuration", () => {
    session.join("1", 0)
    session.join("2", 0)
    session.join("3", 0)

    const firstPlayer = session.players[0]
    const secondPlayer = session.players[1]
    const thirdPlayer = session.players[2]

    const configuration = {
      votingDurationSeconds: 30,
      maxScore: 10,
      reader: false,
      version18Plus: true,
      public: true
    } as const
    session.updateConfiguration(firstPlayer.id, configuration)
    expect(session.configuration).toEqual(configuration)

    session.startGame(firstPlayer.id)
    vi.advanceTimersByTime(GAME_START_DELAY_MS)

    expect(dayjs(session.getTimeoutDate("voting")).diff(dayjs(), "s")).toBe(
      configuration.votingDurationSeconds
    )

    secondPlayer.score = configuration.maxScore - 1

    session.vote(secondPlayer.id, secondPlayer.deck[0].id)
    session.vote(thirdPlayer.id, thirdPlayer.deck[0].id)

    session.choose(firstPlayer.id, secondPlayer.id)
    session.choose(firstPlayer.id, thirdPlayer.id)

    session.chooseWinner(firstPlayer.id, secondPlayer.id)
    vi.advanceTimersByTime(BEST_CARD_VIEW_DURATION_MS)

    expect(session.status).toBe("end")
  })
})

describe("cards discarding", () => {
  it("disallows discarding if player score = 0 and session has a waiting status", () => {
    const player = session.join("user1", 0)
    session.join("user2", 0)
    session.join("user3", 0)

    expect(() => session.discardCards(player.id)).toThrow()

    session.startGame(player.id)
    vi.advanceTimersByTime(GAME_START_DELAY_MS)

    expect(() => session.discardCards(player.id)).toThrow()

    player.score = 3
    expect(() => session.discardCards(player.id)).not.toThrow()
  })

  it("discards as expected", () => {
    const player = session.join("user1", 0)
    const player2 = session.join("user2", 0)
    session.join("user3", 0)

    session.startGame(player.id)
    vi.advanceTimersByTime(GAME_START_DELAY_MS)

    player2.score = 3

    const prevDeckId = player2.deck.reduce((id, card) => (id += card.id), "")

    session.discardCards(player2.id)

    const newDeckId = player2.deck.reduce((id, card) => (id += card.id), "")

    expect(player2.score).toBe(2)
    expect(player2.deck.length).toBe(10)
    expect(prevDeckId).not.toBe(newDeckId)

    session.vote(player2.id, player2.deck[0].id)

    session.discardCards(player2.id)
    expect(player2.deck.length).toBe(10)
  })
})
