import { screen, render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import Waiting from "@/screens/waiting"
import copyText from "@/functions/copy-text"
import { getFakeMasterGameState } from "../../helpers/get-fake-game-state"

import type { GameState } from "@/atoms"

let gameState: GameState
beforeEach(() => {
  gameState = getFakeMasterGameState("waiting")
  gameState.users[0].master = false
})

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

it("sets gameState to null and send leave message when the back button is clicked", async () => {
  const user = userEvent.setup()

  render(
    <Waiting
      gameState={gameState}
      onGameStateUpdate={fakeGameStateUpdateHandler}
    />
  )

  await user.click(screen.getAllByTestId("back-button")[0])
  expect(fakeGameStateUpdateHandler).toBeCalledWith(null)
  expect(mockSendJsonMessage).toBeCalledWith({ type: "leavesession" })
})

it("renders connected users and display extra empty spots", () => {
  render(
    <Waiting
      gameState={gameState}
      onGameStateUpdate={fakeGameStateUpdateHandler}
    />
  )

  const userList = screen.getAllByTestId("user-list")[0]

  for (let i = 0; i < gameState.users.length; i++) {
    expect(userList.children[i]).toHaveTextContent(gameState.users[i].username)
  }

  for (let i = gameState.users.length; i < 10; i++) {
    expect(userList.children[i]).toHaveTextContent("Пусто")
  }
})

it("copies invite link", async () => {
  const user = userEvent.setup()

  render(
    <Waiting
      gameState={gameState}
      onGameStateUpdate={fakeGameStateUpdateHandler}
    />
  )

  await user.click(screen.getAllByTestId("invite-player")[0])
  expect(copyText).toBeCalledWith(`http://localhost?s=${gameState.id}`)
})

it("sends a start message when the start button is clicked", async () => {
  const user = userEvent.setup()

  render(
    <Waiting
      gameState={gameState}
      onGameStateUpdate={fakeGameStateUpdateHandler}
    />
  )

  const startGameButton = screen.getAllByTestId("start-game")[0]
  expect(startGameButton).toBeEnabled()

  await user.click(startGameButton)
  expect(mockSendJsonMessage).toBeCalledWith({ type: "startgame" })
})

it("hides the save configuration button for users who is not the host", async () => {
  const user = userEvent.setup()

  const { unmount } = render(
    <Waiting
      gameState={gameState}
      onGameStateUpdate={fakeGameStateUpdateHandler}
    />
  )

  await user.click(screen.getAllByTestId("show-configuration")[0])
  expect(screen.getAllByTestId("save-configuration")[0]).toBeEnabled()

  gameState.users[0].host = false
  unmount()
  render(
    <Waiting
      gameState={gameState}
      onGameStateUpdate={fakeGameStateUpdateHandler}
    />
  )

  await user.click(screen.getAllByTestId("show-configuration")[0])
  expect(screen.queryByTestId("save-configuration")).not.toBeInTheDocument()
})

it("toggles the audio button", async () => {
  const user = userEvent.setup()

  render(
    <Waiting
      gameState={gameState}
      onGameStateUpdate={fakeGameStateUpdateHandler}
    />
  )

  await user.click(screen.getByTestId("disable-sounds"))
  await user.click(screen.getByTestId("enable-sounds"))
})

it("displays winners when the game ends", () => {
  const endGameState = getFakeMasterGameState("end")

  render(
    <Waiting
      gameState={endGameState}
      onGameStateUpdate={fakeGameStateUpdateHandler}
    />
  )

  const winners = screen.getByTestId("winners")

  expect(winners.children[0]).toHaveTextContent(
    new RegExp(endGameState.winners![1].username)
  )
  expect(winners.children[1]).toHaveTextContent(
    new RegExp(endGameState.winners![0].username)
  )
  expect(winners.children[2]).toHaveTextContent(
    new RegExp(endGameState.winners![2].username)
  )
})
