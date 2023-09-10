import { sessionSocketURLAtom } from "../atoms/session"
import useSocketWithUrlAtom from "./use-socket-jotai"

import type { Options } from "./use-socket-jotai"
import type { Message as SendMessage } from "@evil-cards/server/src/ws/receive"
import type { Message as ReceiveMessage } from "@evil-cards/server/src/ws/send"

type ReceiveMessageWithoutPing = Exclude<ReceiveMessage, { type: "ping" }>

const useSessionSocket = (options?: Options<ReceiveMessageWithoutPing>) => {
  return useSocketWithUrlAtom<SendMessage, ReceiveMessageWithoutPing>(
    sessionSocketURLAtom,
    options
  )
}

export default useSessionSocket
