import useSocket from "./hook"
import { useAtom } from "jotai"

import type { Message as SendMessage } from "@evil-cards/server/src/lib/ws/receive"
import type { Message as ReceiveMessage } from "@evil-cards/server/src/lib/ws/send"
import type { SocketOptions } from "./types"
import type { PrimitiveAtom } from "jotai"

export type Options<R = ReceiveMessage> = Omit<SocketOptions<R>, "url">

const useSocketJotai = <S = SendMessage, R = ReceiveMessage>(
  urlAtom: PrimitiveAtom<string | null>,
  options?: Options<R>
) => {
  const [url, setAtomUrl] = useAtom(urlAtom)

  const {
    close: closeSocket,
    getInstance,
    sendJsonMessage
  } = useSocket<S, R>({
    url,
    ...options
  })

  return {
    url,
    getInstance,
    sendJsonMessage,
    setUrl(url: string) {
      setAtomUrl(url)
    },
    close() {
      setAtomUrl(null)
      closeSocket()
    }
  }
}

export default useSocketJotai
