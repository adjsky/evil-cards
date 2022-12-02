import { render } from "@testing-library/react"
import Entry from "../src/screens/entry"

jest.mock("../src/hooks/use-socket", () => {
  return {
    __esModule: true,
    default: () => ({
      sendJsonMessage() {
        //
      }
    })
  }
})
jest.mock("next/navigation", () => {
  return {
    __esModule: true,
    useSearchParams: () => ({
      has: () => true
    })
  }
})

it("should render", () => {
  render(<Entry />)
})
