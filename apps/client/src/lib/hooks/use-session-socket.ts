import useSocketWithUrlAtom from "./use-socket/hook-jotai"
import { sessionSocketURLAtom } from "../atoms"

import type { Options } from "./use-socket/hook-jotai"

const useSessionSocket = (options?: Options) => {
  return useSocketWithUrlAtom(sessionSocketURLAtom, options)
}

export default useSessionSocket
