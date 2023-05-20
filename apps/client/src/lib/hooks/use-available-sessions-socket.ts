import useSocketWithUrlAtom, {
  getBrandNewJotaiAtom
} from "./use-socket/hook-jotai"

import type { Options } from "./use-socket/hook-jotai"

const socketAtom = getBrandNewJotaiAtom()

const useAvailableSessionsSocket = (options?: Options) => {
  return useSocketWithUrlAtom(socketAtom, options)
}

export default useAvailableSessionsSocket
