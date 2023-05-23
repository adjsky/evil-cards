import React, { useState } from "react"
import getWsHost from "@/lib/server/get-ws-host"
import { useSocket } from "@/lib/hooks"

import Button from "./button"
import Modal from "./modal"
import Close from "@/assets/close.svg"

import type { AvailableSession } from "@evil-cards/server/src/lib/ws/send"

const AvailableSessions: React.FC = () => {
  const { connect, disconnect, state } = useAvailableSessions()
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = () => {
    setIsOpen(true)
    connect()
  }

  const handleClose = () => {
    setIsOpen(false)
    disconnect()
  }

  return (
    <>
      <Button
        variant="outlined"
        className="w-36 uppercase"
        onClick={handleOpen}
      >
        Комнаты
      </Button>
      <SessionsModal isOpen={isOpen} state={state} onClose={handleClose} />
    </>
  )
}

type SessionModalProps = {
  isOpen?: boolean
  state: AvailableSessionsState
  onClose?: () => void
}

const SessionsModal: React.FC<SessionModalProps> = ({
  isOpen,
  state,
  onClose
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="flex h-full max-h-[500px] w-full max-w-xl flex-col rounded-xl bg-gray-100 px-6 py-4 text-gray-900 shadow-lg"
    >
      <div className="relative flex justify-center">
        <Modal.Title as="h3" className="text-2xl font-bold uppercase">
          Комнаты
        </Modal.Title>
        <button onClick={onClose} className="absolute -right-1 -top-1 p-1">
          <Close className="fill-gray-900" />
        </button>
      </div>
      <hr className="border-none py-1" />
      {state.loading && "Loading..."}
      {!state.loading && state.sessions.length == 0 && "Not found"}
      {!state.loading && state.sessions.length > 0 && (
        <div className="scrollable flex flex-grow flex-col gap-1">
          {state.sessions.map((_, index) => (
            <div key={index} className="rounded-lg bg-gray-200 p-5"></div>
          ))}
        </div>
      )}
    </Modal>
  )
}

type AvailableSessionsState =
  | {
      sessions: AvailableSession[]
      loading: false
    }
  | {
      sessions: undefined
      loading: true
    }

const useAvailableSessions = () => {
  const [state, setState] = useState<AvailableSessionsState>({
    loading: true,
    sessions: undefined
  })
  const [url, setUrl] = useState<string | null>(null)

  useSocket<unknown, AvailableSession[]>({
    url,
    onJsonMessage(sessions) {
      setState({
        loading: false,
        sessions
      })
    },
    onClose() {
      setState({
        loading: false,
        sessions: []
      })
    }
  })

  const connect = async () => {
    const result = await getWsHost()

    result.match({
      err() {
        setState({
          loading: true,
          sessions: undefined
        })
      },
      ok(wsHost) {
        setUrl(`${wsHost}/ws/available-sessions`)
      }
    })
  }

  const disconnect = () => {
    setUrl(null)
  }

  return { connect, disconnect, state }
}

export default AvailableSessions
