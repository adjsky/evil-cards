import type { GameState } from "@/atoms"
import type { Status } from "@evil-cards/server/src/lib/ws/send"

const redCard = "redcard"
const votes = [
  { text: "vote1", winner: false, visible: false, userId: "fakeUserId2" },
  { text: "vote2", winner: false, visible: false, userId: "fakeUserId3" },
  { text: "vote3", winner: false, visible: false, userId: "fakeUserId4" },
  { text: "vote4", winner: false, visible: false, userId: "fakeUserId5" }
]
const whiteCards = ["whitecard1", "whitecard2", "whitecard3", "whitecard4"]
const winners = [
  {
    avatarId: 2,
    disconnected: false,
    host: true,
    id: "fakeUserId",
    master: false,
    score: 0,
    username: "abobus1",
    voted: false
  },
  {
    avatarId: 2,
    disconnected: false,
    host: true,
    id: "fakeUserId2",
    master: false,
    score: 7,
    username: "abobus2",
    voted: false
  },
  {
    avatarId: 2,
    disconnected: false,
    host: true,
    id: "fakeUserId3",
    master: false,
    score: 5,
    username: "abobus3",
    voted: false
  }
]
const base: GameState = {
  configuration: {
    maxScore: 10,
    reader: "off",
    votingDurationSeconds: 30
  },
  id: "fakeid",
  redCard: null,
  status: "waiting",
  userId: "fakeUserId",
  users: [
    {
      avatarId: 2,
      disconnected: false,
      host: true,
      id: "fakeUserId",
      master: true,
      score: 0,
      username: "abobus",
      voted: false
    },
    {
      avatarId: 2,
      disconnected: false,
      host: false,
      id: "fakeUserId2",
      master: false,
      score: 0,
      username: "abobus2",
      voted: false
    },
    {
      avatarId: 2,
      disconnected: false,
      host: false,
      id: "fakeUserId3",
      master: false,
      score: 0,
      username: "abobus3",
      voted: false
    },
    {
      avatarId: 2,
      disconnected: false,
      host: false,
      id: "fakeUserId4",
      master: false,
      score: 0,
      username: "abobus4",
      voted: false
    },
    {
      avatarId: 2,
      disconnected: false,
      host: false,
      id: "fakeUserId5",
      master: false,
      score: 0,
      username: "abobus5",
      voted: false
    }
  ],
  votes: [],
  votingEndsAt: null,
  whiteCards: [],
  winners: null
}

export function getFakeMasterGameState(status: Status): GameState {
  const baseToModify = JSON.parse(JSON.stringify(base)) as GameState

  switch (status) {
    case "voting":
      baseToModify.status = "voting"
      baseToModify.whiteCards = whiteCards
      baseToModify.redCard = redCard
      break
    case "end":
      baseToModify.status = "end"
      baseToModify.winners = winners
      break
    case "choosing":
      baseToModify.status = "choosing"
      baseToModify.votes = votes
      baseToModify.whiteCards = whiteCards
      baseToModify.redCard = redCard
      break
    case "choosingbest":
      baseToModify.status = "choosingbest"
      baseToModify.votes = votes.map((vote) => ({ ...vote, visible: true }))
      baseToModify.whiteCards = whiteCards
      baseToModify.redCard = redCard
      break
    case "bestcardview":
      baseToModify.status = "bestcardview"
      baseToModify.votes = votes.map((vote) => ({ ...vote, visible: true }))
      baseToModify.votes[0].winner = true

      baseToModify.whiteCards = whiteCards
      baseToModify.redCard = redCard
      break
    case "starting":
      baseToModify.status = "starting"
      break
  }

  return baseToModify
}

export function getFakeNonMasterGameState(status: Status): GameState {
  return { ...getFakeMasterGameState(status), userId: "fakeUserId2" }
}
