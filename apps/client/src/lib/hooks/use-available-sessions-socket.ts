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

  const { close, setUrl } = useSocketWithUrlAtom<unknown, AvailableSession[]>(
    availableSessionsSocketURLAtom,
    {
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
      shouldReconnect({ closedGracefully, nReconnects }) {
        return nReconnects < 5 && !closedGracefully
      }
    }
  )

  const connect = async () => {
    const result = await getWsHost()

    result.match({
      err() {
        setState({
          loading: false,
          sessions: state.sessions ?? []
        })
      },
      ok(wsHost) {
        setUrl(`${wsHost}/ws/available-sessions`)
      }
    })
  }

  return { connect, close, state }
}

export default useAvailableSessions
