import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { mockAnimationsApi } from "jsdom-testing-mocks"
import WS from "jest-websocket-mock"
import { Provider } from "jotai"
import { sessionSocketURLAtom } from "@/lib/atoms"
import { okAsync } from "neverthrow"

import Entry from "@/screens/entry"
import { AVAILABLE_AVATARS } from "@/lib/data/constants"
import mockLocation from "../../helpers/mock-location"

const { changeURL, resetLocationMock } = mockLocation("http://localhost")

let server: WS
const host = `ws://localhost:1234`

jest.mock("next/router", () => ({
  useRouter: () => ({
    //
  })
}))
jest.mock("@/lib/server/get-ws-host", () => ({
  __esModule: true,
  default: () => okAsync(host)
}))
mockAnimationsApi()

beforeEach(() => {
  server = new WS(`${host}/ws/session`)
})

afterEach(() => {
  WS.clean()
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

it("toggles the nickname button and writes to the input", async () => {
  const user = userEvent.setup()
  render(<Entry />)

  await user.click(screen.getByTestId("nickname-toggle"))
  await user.clear(screen.getByTestId("nickname-input"))
  await user.type(screen.getByTestId("nickname-input"), "nickname")
  expect(screen.getByTestId("nickname-input")).toHaveValue("nickname")
})

it("sends a join request if 's' query param is provided", async () => {
  changeURL("http://localhost?s=asd")

  const user = userEvent.setup()
  render(
    <Provider initialValues={[[sessionSocketURLAtom, null]]}>
      <Entry />
    </Provider>
  )

  await user.click(screen.getByTestId("connect-session"))
  await server.connected

  await waitFor(() => {
    const message = JSON.parse(server.messages[0].toString())

    expect(message).toEqual(expect.objectContaining({ type: "joinsession" }))
  })
})

it("sends a create request if 's' query param is not provided", async () => {
  const user = userEvent.setup()
  render(
    <Provider initialValues={[[sessionSocketURLAtom, null]]}>
      <Entry />
    </Provider>
  )

  await user.click(screen.getByTestId("connect-session"))
  await server.connected

  await waitFor(() => {
    const message = JSON.parse(server.messages[0].toString())

    expect(message).toEqual(expect.objectContaining({ type: "createsession" }))
  })
})
