import { useAtom } from "jotai"

import useSocket from "@/core/use-socket"

import type { JsonLike, SocketOptions } from "@/core/use-socket"
import type { PrimitiveAtom } from "jotai"

export type Options<R = unknown> = Omit<SocketOptions<R>, "url">

const useSocketJotai = <S = JsonLike, R = JsonLike>(
  urlAtom: PrimitiveAtom<string | null>,
  options?: Options<R>
) => {
  const [url, setAtomUrl] = useAtom(urlAtom)

  const { closeSocket, getInstance, sendJsonMessage } = useSocket<S, R>({
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
    resetSocketUrl() {
      setAtomUrl(null)
    },
    closeSocket
  }
}

export default useSocketJotai
