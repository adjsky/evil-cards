import React, { useState } from "react"
import Image from "next/image"
import getWsHost from "@/lib/server/get-ws-host"
import { useSocket } from "@/lib/hooks"
import useCreateOrJoinSession from "@/lib/hooks/use-create-or-join-session"

import Button from "./button"
import Modal from "./modal"
import Loader from "./loader"

import Close from "@/assets/close/line.svg"
import ClockCold from "@/assets/clocks/cold.svg"
import ClockNormal from "@/assets/clocks/normal.svg"
import ClockHot from "@/assets/clocks/hot.svg"
import CatBaby from "@/assets/cats/baby.svg"
import CatAdult from "@/assets/cats/adult.svg"

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
  const { createOrJoinSession, connecting, sessionId } =
    useCreateOrJoinSession()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="flex h-full max-h-[560px] w-full max-w-xl flex-col rounded-xl bg-gray-100 px-3 pt-4 pb-6 text-gray-900 shadow-lg sm:px-6 sm:pb-8 sm:pt-5"
    >
      <div className="relative flex justify-center">
        <Modal.Title
          as="h3"
          className="text-2xl font-bold uppercase sm:text-3xl"
        >
          Комнаты
        </Modal.Title>
        <button onClick={onClose} className="absolute -right-1 -top-1 p-1">
          <Close className="fill-gray-900" />
        </button>
      </div>
      <hr className="border-none py-1.5 sm:py-2.5" />
      {state.loading && (
        <div className="flex flex-grow items-center justify-center">
          <Loader className="fill-gray-900" width={30} height={30} />
        </div>
      )}
      {!state.loading && state.sessions.length == 0 && (
        <div className="flex flex-grow items-center justify-center text-xl font-medium">
          Ой, сейчас нет доступных комнат
        </div>
      )}
      {!state.loading && state.sessions.length > 0 && (
        <div className="scrollable flex flex-grow flex-col gap-2">
          {state.sessions.map((session) => (
            <button
              key={session.id}
              className="flex items-center justify-between rounded-lg bg-gray-200 p-2 sm:p-3"
              onClick={() => createOrJoinSession(session.id)}
              disabled={connecting}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <Image
                  src={`/avatars/${session.hostAvatarId}.svg`}
                  width={60}
                  height={60}
                  alt="Avatar"
                  className="w-9 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 sm:w-14"
                />
                <span className="font-bold sm:text-xl">
                  {session.hostNickname}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                {session.id == sessionId && connecting && (
                  <Loader className="h-4 w-4 fill-gray-900 sm:h-6 sm:w-6" />
                )}
                <div className="flex items-center sm:gap-1">
                  {session.speed == "fast" ? (
                    <ClockHot className="sm:h-11 sm:w-11" />
                  ) : session.speed == "normal" ? (
                    <ClockNormal className="sm:h-11 sm:w-11" />
                  ) : (
                    <ClockCold className="sm:h-11 sm:w-11" />
                  )}
                  {session.adultOnly ? (
                    <CatAdult className="sm:h-11 sm:w-11" />
                  ) : (
                    <CatBaby className="sm:h-11 sm:w-11" />
                  )}
                </div>
                <span className="text-lg font-bold sm:text-2xl">
                  {session.players}/10
                </span>
              </div>
            </button>
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
        sessions: state.sessions ?? []
      })
    }
  })

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

  const disconnect = () => {
    setUrl(null)
  }

  return { connect, disconnect, state }
}

export default AvailableSessions
