import useSocket from "./hook"
import { useAtom, atom } from "jotai"

import type { Message as SendMessage } from "@evil-cards/server/src/lib/ws/receive"
import type { Message as ReceiveMessage } from "@evil-cards/server/src/lib/ws/send"
import type { SocketOptions } from "./hook"
import type { PrimitiveAtom } from "jotai"

export type Options<R = ReceiveMessage> = Omit<SocketOptions<R>, "url">

export function getBrandNewJotaiAtom() {
  return atom<string | null>(null)
}

const useSocketJotai = <S = SendMessage, R = ReceiveMessage>(
  urlAtom: PrimitiveAtom<string | null>,
  options?: Options<R>
) => {
  const [url, setUrl] = useAtom(urlAtom)

  const hookResult = useSocket<S, R>({
    url,
    ...options
  })

  return {
    ...hookResult,
    updateUrl: setUrl,
    url
  }
}

export default useSocketJotai
