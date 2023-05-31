import useSocket from "./hook"
import { useAtom } from "jotai"

import type { SocketOptions } from "./types"
import type { PrimitiveAtom } from "jotai"
import type { JsonLike } from "./types"

export type Options<R = unknown> = Omit<SocketOptions<R>, "url">

const useSocketJotai = <S = JsonLike, R = JsonLike>(
  urlAtom: PrimitiveAtom<string | null>,
  options?: Options<R>
) => {
  const [url, setAtomUrl] = useAtom(urlAtom)

  const { close, getInstance, sendJsonMessage } = useSocket<S, R>({
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
    resetUrl() {
      setAtomUrl(null)
    },
    close
  }
}

export default useSocketJotai
