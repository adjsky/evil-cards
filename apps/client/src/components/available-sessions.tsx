import React, { useState } from "react"
import getWsHost from "@/lib/server/get-ws-host"
import { useToggle, useSocket } from "@/lib/hooks"

import Button from "./button"

import type { AvailableSession } from "@evil-cards/server/src/lib/ws/send"

const AvailableSessions: React.FC = () => {
  const { connect, disconnect } = useAvailableSessions()
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
        className="px-3.5"
        onClick={() => {
          if (toggled) {
            handleClose()
          } else {
            handleOpen()
          }
        }}
      >
        КОМНАТЫ
      </Button>
      {toggled && <Modal />}
    </>
  )
}

const Modal: React.FC = () => {
  return null
}

const useAvailableSessions = () => {
  const [availableSessions, setAvailableSessions] = useState<
    AvailableSession[] | undefined
  >(undefined)
  const [connecting, setConnecting] = useState(false)
  const [url, setUrl] = useState<string | null>(null)

  useSocket<unknown, AvailableSession[]>({
    url,
    onJsonMessage(data) {
      setAvailableSessions(data)
    },
    onClose() {
      setConnecting(false)
    },
    onOpen() {
      setConnecting(false)
    }
  })

  const connect = async () => {
    setConnecting(true)

    const result = await getWsHost()

    result.match({
      err() {
        setConnecting(false)
      },
      ok(wsHost) {
        setUrl(`${wsHost}/ws/available-sessions`)
      }
    })
  }

  const disconnect = () => {
    setUrl(null)
  }

  return { availableSessions, connecting, connect, disconnect }
}

export default AvailableSessions
