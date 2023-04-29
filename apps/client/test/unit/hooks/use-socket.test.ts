import { renderHook } from "@testing-library/react"
import { useSocket } from "@/lib/hooks"

it("asdasd", () => {
  const { result } = renderHook(() => useSocket())

  expect(result.current.connected).toBe(false)
})
