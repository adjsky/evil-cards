import { render } from "@testing-library/react"
import Entry from "@/screens/entry"

jest.mock("@/hooks/use-socket", () => {
  return {
    __esModule: true,
    default: () => ({
      sendJsonMessage() {
        //
      },
      connected: true
    })
  }
})
jest.mock("next/navigation", () => {
  return {
    useSearchParams: () => ({
      has: () => true
    })
  }
})

it("should render", () => {
  render(<Entry />)
})
