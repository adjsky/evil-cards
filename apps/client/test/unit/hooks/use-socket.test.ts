import { renderHook, act } from "@testing-library/react"
import { useSocket } from "@/lib/hooks"
import WS from "jest-websocket-mock"

const url = "ws://localhost:1234"
let server: WS

beforeEach(() => {
  server = new WS(url)
})

afterEach(() => {
  WS.clean()
})

describe("single instance", () => {
  describe("connection", () => {
    it("connects and disconnects", async () => {
      const { result, unmount } = renderHook(() => useSocket({ url }))
      await server.connected

      expect(result.current.getInstance()?.readyState).toBe(WebSocket.OPEN)

      unmount()
      await server.closed

      expect(result.current.getInstance()?.readyState).toBe(WebSocket.CLOSED)
    })
  })

  it("receives incoming messages", async () => {
    const callback = jest.fn()

    renderHook(() => useSocket({ url, onJsonMessage: callback }))
    await server.connected

    const message = { message: "AasdasdASDASDASDASD" }

    act(() => {
      server.send(JSON.stringify(message))
    })

    expect(callback).toBeCalledWith(message)

    server.close()
  })
})

describe("multiple instances", () => {
  describe("connection", () => {
    it("connects and disconnects", async () => {
      const hook1 = renderHook(() => useSocket({ url }))
      await server.connected

      const hook2 = renderHook(() => useSocket({ url }))
      await server.connected

      expect(hook1.result.current.getInstance()?.readyState).toBe(
        WebSocket.OPEN
      )
      expect(hook2.result.current.getInstance()?.readyState).toBe(
        WebSocket.OPEN
      )

      expect(hook1.result.current.getInstance()).toBe(
        hook2.result.current.getInstance()
      )

      hook1.unmount()
      expect(hook1.result.current.getInstance()?.readyState).toBe(
        WebSocket.OPEN
      )
      expect(hook2.result.current.getInstance()?.readyState).toBe(
        WebSocket.OPEN
      )

      hook2.unmount()
      await server.closed

      expect(hook1.result.current.getInstance()?.readyState).toBe(
        WebSocket.CLOSED
      )
      expect(hook2.result.current.getInstance()?.readyState).toBe(
        WebSocket.CLOSED
      )
    })
  })

  it("receives incoming messages (callbacks)", async () => {
    const callback = jest.fn()

    renderHook(() => useSocket({ url, onJsonMessage: callback }))
    await server.connected

    renderHook(() => useSocket({ url, onJsonMessage: callback }))
    await server.connected

    const message = { message: "AasdasdASDASDASDASD" }

    act(() => {
      server.send(JSON.stringify(message))
    })

    expect(callback).toBeCalledTimes(2)
    expect(callback).toBeCalledWith(message)

    server.close()
  })
})
