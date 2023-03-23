import type { GameState } from "@/lib/atoms"
import type { Status } from "@evil-cards/server/src/lib/ws/send"

const redCard = "redcard"
const votes = [
  { text: "vote1", winner: false, visible: false, playerId: "fakePlayerId2" },
  { text: "vote2", winner: false, visible: false, playerId: "fakePlayerId3" },
  { text: "vote3", winner: false, visible: false, playerId: "fakePlayerId4" },
  { text: "vote4", winner: false, visible: false, playerId: "fakePlayerId5" }
]
const deck = [
  { id: "1", text: "whitecard1" },
  { id: "2", text: "whitecard2" },
  { id: "3", text: "whitecard3" },
  { id: "4", text: "whitecard4" }
]
const winners = [
  {
    avatarId: 2,
    disconnected: false,
    host: true,
    id: "fakePlayerId",
    master: false,
    score: 0,
    nickname: "abobus1",
    voted: false
  },
  {
    avatarId: 2,
    disconnected: false,
    host: true,
    id: "fakePlayerId2",
    master: false,
    score: 7,
    nickname: "abobus2",
    voted: false
  },
  {
    avatarId: 2,
    disconnected: false,
    host: true,
    id: "fakePlayerId3",
    master: false,
    score: 5,
    nickname: "abobus3",
    voted: false
  }
]
const base: GameState = {
  configuration: {
    maxScore: 10,
    reader: false,
    version18Plus: true,
    votingDurationSeconds: 30
  },
  id: "fakeid",
  redCard: null,
  status: "waiting",
  playerId: "fakePlayerId",
  players: [
    {
      avatarId: 2,
      disconnected: false,
      host: true,
      id: "fakePlayerId",
      master: true,
      score: 0,
      nickname: "abobus",
      voted: false
    },
    {
      avatarId: 2,
      disconnected: false,
      host: false,
      id: "fakePlayerId2",
      master: false,
      score: 0,
      nickname: "abobus2",
      voted: false
    },
    {
      avatarId: 2,
      disconnected: false,
      host: false,
      id: "fakePlayerId3",
      master: false,
      score: 0,
      nickname: "abobus3",
      voted: false
    },
    {
      avatarId: 2,
      disconnected: false,
      host: false,
      id: "fakePlayerId4",
      master: false,
      score: 0,
      nickname: "abobus4",
      voted: false
    },
    {
      avatarId: 2,
      disconnected: false,
      host: false,
      id: "fakePlayerId5",
      master: false,
      score: 0,
      nickname: "abobus5",
      voted: false
    }
  ],
  votes: [],
  votingEndsAt: null,
  deck: [],
  winners: null
}

export function getFakeMasterGameState(status: Status): GameState {
  const baseToModify = JSON.parse(JSON.stringify(base)) as GameState

  switch (status) {
    case "voting":
      baseToModify.status = "voting"
      baseToModify.deck = deck
      baseToModify.redCard = redCard
      break
    case "end":
      baseToModify.status = "end"
      baseToModify.winners = winners
      break
    case "choosing":
      baseToModify.status = "choosing"
      baseToModify.votes = votes
      baseToModify.deck = deck
      baseToModify.redCard = redCard
      break
    case "choosingwinner":
      baseToModify.status = "choosingwinner"
      baseToModify.votes = votes.map((vote) => ({ ...vote, visible: true }))
      baseToModify.deck = deck
      baseToModify.redCard = redCard
      break
    case "winnercardview":
      baseToModify.status = "winnercardview"
      baseToModify.votes = votes.map((vote) => ({ ...vote, visible: true }))
      baseToModify.votes[0].winner = true

      baseToModify.deck = deck
      baseToModify.redCard = redCard
      break
    case "starting":
      baseToModify.status = "starting"
      break
  }

  return baseToModify
}

export function getFakeNonMasterGameState(status: Status): GameState {
  return { ...getFakeMasterGameState(status), playerId: "fakePlayerId2" }
}
