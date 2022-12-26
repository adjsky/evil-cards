import { screen, render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import Waiting from "@/screens/waiting"
import copyText from "@/functions/copy-text"

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
jest.mock("@/functions/copy-text", () => {
  return {
    __esModule: true,
    default: jest.fn()
  }
})

beforeEach(() => {
  mockSendJsonMessage.mockClear()
  fakeGameStateUpdateHandler.mockClear()
})

it("should set gameState to null and send leave message when the back button is clicked", async () => {
  const user = userEvent.setup()

  render(
    <Waiting
      gameState={fakeGameState}
      onGameStateUpdate={fakeGameStateUpdateHandler}
    />
  )

  await user.click(screen.getAllByTestId("back-button")[0])
  expect(fakeGameStateUpdateHandler).toBeCalledWith(null)
  expect(mockSendJsonMessage).toBeCalledWith({ type: "leavesession" })
})

it("should render connected users and display extra empty spots", () => {
  render(
    <Waiting
      gameState={fakeGameState}
      onGameStateUpdate={fakeGameStateUpdateHandler}
    />
  )

  const userList = screen.getAllByTestId("user-list")[0]

  expect(userList).toHaveTextContent(fakeGameState.users[0].username)

  for (let i = 1; i < 10; i++) {
    expect(userList.children[i]).toHaveTextContent("Пусто")
  }
})

it("should copy invite link", async () => {
  const user = userEvent.setup()

  render(
    <Waiting
      gameState={fakeGameState}
      onGameStateUpdate={fakeGameStateUpdateHandler}
    />
  )

  await user.click(screen.getAllByTestId("invite-player")[0])
  expect(copyText).toBeCalledWith(`http://localhost?s=${fakeGameState.id}`)
})

it("should send start message when the start button is clicked", async () => {
  const user = userEvent.setup()

  render(
    <Waiting
      gameState={fakeGameState}
      onGameStateUpdate={fakeGameStateUpdateHandler}
    />
  )

  await user.click(screen.getAllByTestId("start-game")[0])
  expect(mockSendJsonMessage).toBeCalledWith({ type: "startgame" })
})

it("shouldn't have the save configuration button for users who is not the host", async () => {
  const user = userEvent.setup()

  const { unmount } = render(
    <Waiting
      gameState={fakeGameState}
      onGameStateUpdate={fakeGameStateUpdateHandler}
    />
  )

  await user.click(screen.getAllByTestId("show-configuration")[0])
  expect(screen.getAllByTestId("save-configuration")[0]).toBeEnabled()

  const fakeGameStateCopy = { ...fakeGameState }
  fakeGameStateCopy.users[0].host = false

  unmount()
  render(
    <Waiting
      gameState={fakeGameStateCopy}
      onGameStateUpdate={fakeGameStateUpdateHandler}
    />
  )

  await user.click(screen.getAllByTestId("show-configuration")[0])
  expect(screen.queryByTestId("save-configuration")).not.toBeInTheDocument()
})

it("should toggle audio button", async () => {
  const user = userEvent.setup()

  render(
    <Waiting
      gameState={fakeGameState}
      onGameStateUpdate={fakeGameStateUpdateHandler}
    />
  )

  await user.click(screen.getByTestId("disable-sounds"))
  await user.click(screen.getByTestId("enable-sounds"))
})

it("should display winners when game ends", () => {
  const gameState = {
    ...fakeGameState,
    status: "end",
    winners: [
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
  }

  render(
    <Waiting
      gameState={gameState as GameState}
      onGameStateUpdate={fakeGameStateUpdateHandler}
    />
  )

  const winners = screen.getByTestId("winners")

  expect(winners.children[0]).toHaveTextContent(
    new RegExp(gameState.winners[1].username)
  )
  expect(winners.children[1]).toHaveTextContent(
    new RegExp(gameState.winners[0].username)
  )
  expect(winners.children[2]).toHaveTextContent(
    new RegExp(gameState.winners[2].username)
  )
})
