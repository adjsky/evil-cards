import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import Entry from "@/screens/entry"
import { AVAILABLE_AVATARS } from "@/lib/data/constants"
import mockLocation from "../../helpers/mock-location"

const { changeURL, resetLocationMock } = mockLocation("http://localhost")

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

afterEach(() => {
  sendJsonMessageMock.mockClear()
  resetLocationMock()
})

it("changes and renders avatar", async () => {
  const user = userEvent.setup()
  render(<Entry />)

  const nextAvatar = screen.getByTestId("avatar-next")
  const prevAvatar = screen.getByTestId("avatar-prev")

  const checkAvatar = (id: number) => {
    expect(screen.getByTestId("avatar")).toHaveStyle(
      `background-image: url(/avatars/${id}.svg)`
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

it("toggles the username button and writes to the input", async () => {
  const user = userEvent.setup()
  render(<Entry />)

  await user.click(screen.getByTestId("username-toggle"))
  await user.clear(screen.getByTestId("username-input"))
  await user.type(screen.getByTestId("username-input"), "username")
  expect(screen.getByTestId("username-input")).toHaveValue("username")
})

it("sends a join request if 's' query param is provided", async () => {
  changeURL("http://localhost?s=asd")

  const user = userEvent.setup()
  render(<Entry />)

  await user.click(screen.getByTestId("connect-session"))

  expect(sendJsonMessageMock).toHaveBeenCalledWith(
    expect.objectContaining({ type: "joinsession" })
  )
})

it("sends a create request if 's' query param is not provided", async () => {
  const user = userEvent.setup()
  render(<Entry />)

  await user.click(screen.getByTestId("connect-session"))

  expect(sendJsonMessageMock).toHaveBeenCalledWith(
    expect.objectContaining({ type: "createsession" })
  )
})
