import useSocketWithUrlAtom from "./use-socket/hook-jotai"
import { sessionSocketURLAtom } from "../atoms"

import type { Options } from "./use-socket/hook-jotai"
import type { Message as SendMessage } from "@evil-cards/server/src/lib/ws/receive"
import type { Message as ReceiveMessage } from "@evil-cards/server/src/lib/ws/send"

type ReceiveMessageWithoutPing = Exclude<ReceiveMessage, { type: "ping" }>

const useSessionSocket = (options?: Options<ReceiveMessageWithoutPing>) => {
  return useSocketWithUrlAtom<SendMessage, ReceiveMessageWithoutPing>(
    sessionSocketURLAtom,
    options
  )
}

export default useSessionSocket
