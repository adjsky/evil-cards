import { renderHook, waitFor } from "@testing-library/react"
import { Server } from "mock-socket"

import useSocket from "./hook"

const url = "ws://127.0.0.1:1234"
let server: Server

beforeEach(() => {
  server = new Server(url)
})

afterEach(() => {
  server.close()
})

describe("connection", () => {
  it("connects and disconnects", async () => {
    const onOpenFn = vi.fn()
    const onCloseFn = vi.fn()

    const { result } = renderHook(() =>
      useSocket({ url, onOpen: onOpenFn, onClose: onCloseFn })
    )

    await waitFor(() => expect(onOpenFn).toHaveBeenCalledOnce())
    expect(result.current.getInstance()).not.toBe(null)

    result.current.closeSocket()

    await waitFor(() => {
      expect(result.current.getInstance()?.readyState).toBe(WebSocket.CLOSED)
      expect(onCloseFn).toBeCalledTimes(1)
    })
  })

  it("matches url to instance", async () => {
    const { result: firstResult } = renderHook(() => useSocket({ url }))
    const { result: secondResult } = renderHook(() => useSocket({ url }))

    await waitFor(() => {
      expect(firstResult.current.getInstance()?.readyState).toBe(WebSocket.OPEN)
      expect(secondResult.current.getInstance()?.readyState).toBe(
        WebSocket.OPEN
      )
    })

    expect(firstResult.current.getInstance()).toBe(
      secondResult.current.getInstance()
    )
  })
})

describe("messages", () => {
  it("sends and receives messages", async () => {
    const onJsonMessageFn = vi.fn()
    const onServerMessageFn = vi.fn()

    const { result } = renderHook(() =>
      useSocket({ url, onJsonMessage: onJsonMessageFn })
    )

    await waitFor(() => {
      expect(result.current.getInstance()?.readyState).toBe(WebSocket.OPEN)
    })

    const jsonData = { hi: "hi!" }

    server.emit("message", JSON.stringify(jsonData))
    await waitFor(() => expect(onJsonMessageFn).toBeCalledWith(jsonData))

    expect(server.clients().length).toBe(1)
    server.clients()[0].on("message", onServerMessageFn)

    result.current.sendJsonMessage(jsonData)
    await waitFor(() => {
      expect(onServerMessageFn).toBeCalledWith(JSON.stringify(jsonData))
    })
  })

  it("sends messages to all clients connected to the same url", async () => {
    const onJsonMessageFn = vi.fn()

    const { result: firstResult } = renderHook(() =>
      useSocket({ url, onJsonMessage: onJsonMessageFn })
    )
    const { result: secondResult } = renderHook(() =>
      useSocket({ url, onJsonMessage: onJsonMessageFn })
    )
    const { result: thirdResult } = renderHook(() =>
      useSocket({ onJsonMessage: onJsonMessageFn })
    )

    await waitFor(() => {
      expect(firstResult.current.getInstance()?.readyState).toBe(WebSocket.OPEN)
      expect(secondResult.current.getInstance()?.readyState).toBe(
        WebSocket.OPEN
      )
      expect(thirdResult.current.getInstance()).toBe(null)
    })

    server.emit("message", JSON.stringify({}))
    await waitFor(() => {
      expect(onJsonMessageFn).toBeCalledTimes(2)
    })
  })
})
