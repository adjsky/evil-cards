import useSocketWithUrlAtom, {
  getBrandNewJotaiAtom
} from "./use-socket/hook-jotai"

import type { Options } from "./use-socket/hook-jotai"

export const socketAtom = getBrandNewJotaiAtom()

const useSessionSocket = (options?: Options) => {
  return useSocketWithUrlAtom(socketAtom, options)
}

export default useSessionSocket
