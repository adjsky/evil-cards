import { useAtom } from "jotai"
import useSocketWithUrlAtom from "./use-socket/hook-jotai"
import {
  availableSessionsSocketURLAtom,
  availableSessionsStateAtom
} from "../atoms"
import getWsHost from "@/lib/server/get-ws-host"

import type { AvailableSession } from "@evil-cards/server/src/lib/ws/send"

const useAvailableSessions = () => {
  const [state, setState] = useAtom(availableSessionsStateAtom)

  const { close, setUrl, resetUrl } = useSocketWithUrlAtom<
    unknown,
    AvailableSession[]
  >(availableSessionsSocketURLAtom, {
    onJsonMessage(sessions) {
      setState({
        loading: false,
        sessions
      })
    },
    onClose() {
      setState({
        loading: false,
        sessions: state.sessions ?? []
      })
    },
    shouldReconnect(_, { closedGracefully, nReconnects }) {
      return nReconnects < 5 && !closedGracefully
    }
  })

  return {
    async connect() {
      getWsHost().match(
        (wsHost) => setUrl(`${wsHost}/ws/available-sessions`),
        () =>
          setState({
            loading: false,
            sessions: state.sessions ?? []
          })
      )
    },
    close,
    state,
    resetUrl
  }
}

export default useAvailableSessions
