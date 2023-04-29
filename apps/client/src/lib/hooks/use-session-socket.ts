import useSocket from "./use-socket"
import { useAtom } from "jotai"
import { sessionWsUrlAtom } from "../atoms"

import type { Message as SendMessage } from "@evil-cards/server/src/lib/ws/receive"
import type { Message as ReceiveMessage } from "@evil-cards/server/src/lib/ws/send"
import type { SocketOptions } from "./use-socket"

const useSessionSocket = (
  options?: Omit<SocketOptions<ReceiveMessage>, "url">
) => {
  const [sessionWsUrl, setSessionWsUrl] = useAtom(sessionWsUrlAtom)

  const hookResult = useSocket<SendMessage, ReceiveMessage>({
    url: sessionWsUrl,
    ...options
  })

  return {
    ...hookResult,
    updateUrl(url: string | null) {
      setSessionWsUrl(url)
    }
  }
}

export default useSessionSocket
