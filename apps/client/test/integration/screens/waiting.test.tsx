import { render } from "@testing-library/react"

import Waiting from "@/screens/waiting"
import type { GameState } from "@/atoms"

const fakeGameState: GameState = {
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
      master: false,
      score: 0,
      username: "abobus",
      voted: false
    }
  ],
  votes: [],
  votingEndsAt: null,
  whiteCards: [],
  winners: null
}
const fakeGameStateUpdateHandler = jest.fn()

const mockSendJsonMessage = jest.fn()
jest.mock("@/hooks/use-socket", () => {
  return {
    __esModule: true,
    default: () => ({
      sendJsonMessage: mockSendJsonMessage,
      connected: true
    })
  }
})

beforeEach(() => {
  mockSendJsonMessage.mockClear()
  fakeGameStateUpdateHandler.mockClear()
})

it("renders", () => {
  render(
    <Waiting
      gameState={fakeGameState}
      onGameStateUpdate={fakeGameStateUpdateHandler}
    />
  )
})
