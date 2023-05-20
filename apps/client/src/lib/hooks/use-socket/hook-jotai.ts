import useSocket from "./hook"
import { useAtom, atom } from "jotai"

import type { Message as SendMessage } from "@evil-cards/server/src/lib/ws/receive"
import type { Message as ReceiveMessage } from "@evil-cards/server/src/lib/ws/send"
import type { SocketOptions } from "./hook"
import type { PrimitiveAtom } from "jotai"

export type Options = Omit<SocketOptions<ReceiveMessage>, "url">

export function getBrandNewJotaiAtom() {
  return atom<string | null>(null)
}

const useSocketJotai = (
  urlAtom: PrimitiveAtom<string | null>,
  options?: Options
) => {
  const [url, setUrl] = useAtom(urlAtom)

  const hookResult = useSocket<SendMessage, ReceiveMessage>({
    url,
    ...options
  })

  return {
    ...hookResult,
    updateUrl(url: string | null) {
      setUrl(url)
    }
  }
}

export default useSocketJotai
