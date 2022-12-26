import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useSearchParams } from "next/navigation"

import Entry from "@/screens/entry"
import { AVAILABLE_AVATARS } from "@/data/constants"

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
jest.mock("next/navigation", () => {
  return {
    useSearchParams: jest.fn(() => ({
      has: (param: string) => param == "s",
      get: (param: string) => (param == "s" ? "testid" : null)
    }))
  }
})

beforeEach(() => {
  mockSendJsonMessage.mockClear()
})

it("changes and renders avatar", async () => {
  const user = userEvent.setup()
  render(<Entry />)

  const nextAvatar = screen.getByTestId("avatar-next")
  const prevAvatar = screen.getByTestId("avatar-prev")

  const checkAvatar = (id: number) => {
    expect(screen.getByTestId("avatar")).toHaveAttribute(
      "src",
      `/avatars/${id}.svg`
    )
  }

  checkAvatar(1)
  await user.click(nextAvatar)
  checkAvatar(2)
  await user.click(prevAvatar)
  checkAvatar(1)
  await user.click(prevAvatar)
  checkAvatar(AVAILABLE_AVATARS)
  await user.click(nextAvatar)
  checkAvatar(1)
})

it("toggles username button and writes to input", async () => {
  const user = userEvent.setup()
  render(<Entry />)

  await user.click(screen.getByTestId("username-toggle"))
  await user.clear(screen.getByTestId("username-input"))
  await user.type(screen.getByTestId("username-input"), "username")
  expect(screen.getByTestId("username-input")).toHaveValue("username")
})

it("sends join request if 's' query param is provided", async () => {
  const user = userEvent.setup()
  render(<Entry />)

  await user.click(screen.getByTestId("connect-session"))

  expect(mockSendJsonMessage).toHaveBeenCalledWith(
    expect.objectContaining({ type: "joinsession" })
  )
})

it("sends create request if 's' query param is not provided", async () => {
  const mockUseSearchParams = useSearchParams as jest.Mock
  mockUseSearchParams.mockImplementation(() => ({
    has: () => false,
    get: () => null
  }))

  const user = userEvent.setup()
  render(<Entry />)

  await user.click(screen.getByTestId("connect-session"))

  expect(mockSendJsonMessage).toHaveBeenCalledWith(
    expect.objectContaining({ type: "createsession" })
  )
})
