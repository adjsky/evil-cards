import { screen, render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { mockAnimationsApi } from "jsdom-testing-mocks"

import Game from "@/screens/game"
import {
  getFakeMasterGameState,
  getFakeNonMasterGameState
} from "../../helpers/get-fake-game-state"

const fakeGameStateUpdateHandler = jest.fn()
const sendJsonMessageMock = jest.fn()
jest.mock("@/lib/hooks/use-socket", () => {
  return {
    __esModule: true,
    default: () => ({
      sendJsonMessage: sendJsonMessageMock,
      connected: true
    })
  }
})
mockAnimationsApi()

beforeEach(() => {
  sendJsonMessageMock.mockClear()
  fakeGameStateUpdateHandler.mockClear()
})

describe("red cards", () => {
  it("displays red card", () => {
    const gameState = getFakeMasterGameState("voting")
    expect(gameState.redCard).not.toBeNull()

    render(<Game gameState={gameState} />)

    expect(screen.getByTestId("red-card")).toHaveTextContent(gameState.redCard!)
  })
})

describe("white cards", () => {
  it("renders white cards", () => {
    const gameState = getFakeMasterGameState("voting")
    render(<Game gameState={gameState} />)

    const cards = screen.getByTestId("cards")
    expect(cards.children.length).toBe(gameState.whiteCards.length)
  })

  it("sends a vote message when the white card is clicked", async () => {
    const user = userEvent.setup()

    render(<Game gameState={getFakeNonMasterGameState("voting")} />)

    const firstWhiteCard = screen.getByTestId("cards").children[0]
    await user.click(firstWhiteCard)

    expect(sendJsonMessageMock).toBeCalledWith({
      type: "vote",
      details: { text: firstWhiteCard.textContent }
    })
  })

  it("doesn't allow masters to vote", () => {
    render(<Game gameState={getFakeMasterGameState("voting")} />)

    const cards = screen.getByTestId("cards")
    for (const card of Array.from(cards.children)) {
      expect(card).toBeDisabled()
    }
  })

  it("allows non-masters to vote", () => {
    render(<Game gameState={getFakeNonMasterGameState("voting")} />)

    const cards = screen.getByTestId("cards")
    for (const card of Array.from(cards.children)) {
      expect(card).toBeEnabled()
    }
  })
})

describe("voted cards", () => {
  it("renders votes", () => {
    const gameState = getFakeMasterGameState("choosing")
    render(<Game gameState={gameState} />)

    const votes = screen.getByTestId("votes")
    expect(votes.children.length).toBe(gameState.votes.length)
  })

  it("hides voted cards that are not visible", () => {
    render(<Game gameState={getFakeMasterGameState("choosing")} />)

    const votes = screen.getByTestId("votes")
    for (const vote of Array.from(votes.children)) {
      expect(vote).toHaveTextContent("")
    }
  })

  it("displays a card text if the card is visible", () => {
    const gameState = getFakeMasterGameState("choosingbest")

    render(<Game gameState={gameState} />)

    const votesContainer = screen.getByTestId("votes")

    expect(votesContainer.children.length).toBe(gameState.votes.length)
    for (let i = 0; i < gameState.votes.length; i++) {
      expect(votesContainer.children[i]).toHaveTextContent(
        gameState.votes[i].text
      )
    }
  })

  it("displays a card username if the card is winner", () => {
    const gameState = getFakeMasterGameState("bestcardview")

    const firstVoteUsername = gameState.users.find(
      (user) => user.id == gameState.votes[0].userId
    )?.username
    expect(firstVoteUsername).toBeDefined()

    render(<Game gameState={gameState} />)

    const votesContainer = screen.getByTestId("votes")
    expect(votesContainer.children[0]).toHaveTextContent(firstVoteUsername!)
  })

  it("allows to choose a voted card when game status=choosing and user is master", () => {
    const gameState = getFakeMasterGameState("choosing")

    render(<Game gameState={gameState} />)

    const votesContainer = screen.getByTestId("votes")
    expect(votesContainer.children.length).toBe(gameState.votes.length)

    for (const vote of Array.from(votesContainer.children)) {
      expect(vote.firstChild).toBeEnabled()
    }
  })

  it("doesn't allow to choose a voted card when game status=choosing and user isn't master", () => {
    const gameState = getFakeNonMasterGameState("choosing")

    render(<Game gameState={gameState} />)

    const votesContainer = screen.getByTestId("votes")
    expect(votesContainer.children.length).toBe(gameState.votes.length)

    for (const vote of Array.from(votesContainer.children)) {
      expect(vote.firstChild).toBeDisabled()
    }
  })
})

describe("timebar", () => {
  it("progresses according to configuration and votingEndsAt", () => {
    const dateNowSpy = jest.spyOn(Date, "now").mockImplementation(() => 1000)

    const gameState = getFakeMasterGameState("voting")
    gameState.configuration.votingDurationSeconds = 60
    gameState.votingEndsAt =
      Date.now() + gameState.configuration.votingDurationSeconds * 1000

    const { rerender } = render(<Game gameState={gameState} />)

    expect(screen.getByTestId("timebar")).toHaveStyle({ width: "0%" })

    gameState.votingEndsAt =
      Date.now() + (gameState.configuration.votingDurationSeconds * 1000) / 2
    rerender(<Game gameState={gameState} />)

    expect(screen.getByTestId("timebar")).toHaveStyle({ width: "50%" })

    dateNowSpy.mockRestore()
  })
})
