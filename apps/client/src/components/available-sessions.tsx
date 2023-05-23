import React, { useState } from "react"
import getWsHost from "@/lib/server/get-ws-host"
import { useToggle, useSocket } from "@/lib/hooks"

import Button from "./button"
import Modal from "./modal"
import Close from "@/assets/close.svg"

import type { AvailableSession } from "@evil-cards/server/src/lib/ws/send"

const AvailableSessions: React.FC = () => {
  const { connect, disconnect, availableSessions, loading } =
    useAvailableSessions()
  const [toggled, toggle] = useToggle()

  const handleOpen = () => {
    toggle()
    connect()
  }

  const handleClose = () => {
    toggle()
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
      <SessionsModal
        isOpen={toggled}
        availableSessions={availableSessions}
        loading={loading}
        onClose={handleClose}
      />
    </>
  )
}

type SessionModalProps = {
  isOpen?: boolean
  availableSessions?: AvailableSession[]
  loading: boolean
  onClose?: () => void
}

const SessionsModal: React.FC<SessionModalProps> = ({
  isOpen,
  availableSessions,
  loading,
  onClose
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="flex h-full max-h-[500px] w-full max-w-3xl flex-col rounded-xl bg-gray-100 px-6 py-4 text-gray-900 shadow-lg"
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
      <div className="scrollable grid flex-grow grid-cols-4 gap-1">
        {Array.from({ length: 40 }).map((_, index) => (
          <div key={index} className="border border-gray-900 p-5 rounded-lg"></div>
        ))}
      </div>
    </Modal>
  )
}

const useAvailableSessions = () => {
  const [availableSessions, setAvailableSessions] = useState<
    AvailableSession[] | undefined
  >(undefined)
  const [loading, setLoading] = useState(true)
  const [url, setUrl] = useState<string | null>(null)

  useSocket<unknown, AvailableSession[]>({
    url,
    onJsonMessage(data) {
      setLoading(false)
      setAvailableSessions(data)
    },
    onClose() {
      setLoading(false)
    }
  })

  const connect = async () => {
    const result = await getWsHost()

    result.match({
      err() {
        setLoading(false)
      },
      ok(wsHost) {
        setUrl(`${wsHost}/ws/available-sessions`)
      }
    })
  }

  const disconnect = () => {
    setUrl(null)
  }

  return { availableSessions, loading, connect, disconnect }
}

export default AvailableSessions
