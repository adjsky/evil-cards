import React, { useState } from "react"

import useAvailableSessions from "@/lib/hooks/use-available-sessions-socket"
import useCreateOrJoinSession from "@/lib/hooks/use-create-or-join-session"

import { ReactComponent as CatDealer } from "@/assets/cats/dealer.svg"
import { ReactComponent as CatDevil } from "@/assets/cats/devil.svg"
import { ReactComponent as CatSad } from "@/assets/cats/sad.svg"
import { ReactComponent as CatTwitch } from "@/assets/cats/twitch.svg"
import { ReactComponent as ClockCold } from "@/assets/clocks/cold.svg"
import { ReactComponent as ClockHot } from "@/assets/clocks/hot.svg"
import { ReactComponent as ClockNormal } from "@/assets/clocks/normal.svg"
import { ReactComponent as Close } from "@/assets/close/rounded.svg"

import Button from "./button"
import Loader from "./loader"
import Modal from "./modal"

const AvailableSessions: React.FC = () => {
  const { connect, closeSocket, resetSocketUrl } = useAvailableSessions()
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = () => {
    setIsOpen(true)
    void connect()
  }

  const handleClose = () => {
    setIsOpen(false)
    resetSocketUrl()
    closeSocket()
  }

  return (
    <>
      <Button variant="outlined" className="uppercase" onClick={handleOpen}>
        Комнаты
      </Button>
      <SessionsModal isOpen={isOpen} onClose={handleClose} />
    </>
  )
}

type SessionModalProps = {
  isOpen?: boolean
  onClose?: () => void
}

const SessionsModal: React.FC<SessionModalProps> = ({ isOpen, onClose }) => {
  const { state, connect, closeSocket, resetSocketUrl } = useAvailableSessions()
  const { createOrJoinSession, connecting, sessionId } = useCreateOrJoinSession(
    {
      onFail() {
        void connect()
      }
    }
  )

  const handleJoin = (id: string) => {
    void createOrJoinSession(id)
    resetSocketUrl()
    closeSocket()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="flex h-full max-h-[390px] w-full max-w-xl flex-col rounded-xl bg-gray-900 px-3 pb-6 pt-4 text-gray-100 shadow-lg sm:max-h-[560px] sm:px-6 sm:pb-8 sm:pt-5"
    >
      <div className="relative flex items-center justify-center">
        <Modal.Title
          as="h3"
          className="text-2xl font-bold uppercase !leading-none sm:text-3xl"
        >
          Комнаты
        </Modal.Title>
        <button onClick={onClose} className="absolute -right-1 -top-1 p-1">
          <Close className="h-6 w-6 fill-gray-100 sm:h-7 sm:w-7" />
        </button>
      </div>
      <hr className="border-none py-2 sm:py-2.5" />
      {state.loading && (
        <div className="flex flex-grow items-center justify-center">
          <Loader className="fill-gray-100" width={30} height={30} />
        </div>
      )}
      {!state.loading && state.sessions.length == 0 && (
        <div className="flex flex-grow flex-col items-center justify-center gap-2 pb-6 text-base font-medium sm:pb-8 sm:text-xl">
          <CatSad className="h-[110px] w-[110px] sm:h-auto sm:w-auto" />
          <span className="mx-2">Ой, сейчас нет доступных комнат</span>
        </div>
      )}
      {!state.loading && state.sessions.length > 0 && (
        <div className="scrollable flex flex-grow flex-col gap-2">
          {state.sessions.map((session) => (
            <button
              key={session.id}
              className="flex items-center justify-between rounded-lg bg-gray-100 p-2 text-gray-900 sm:p-3"
              onClick={() => handleJoin(session.id)}
              disabled={connecting}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <img
                  src={`/avatars/${session.hostAvatarId}.svg`}
                  width={60}
                  height={60}
                  alt={`Аватар ${session.hostAvatarId}`}
                  className="w-9 flex-shrink-0 sm:w-14"
                  loading="lazy"
                  decoding="async"
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
                    <ClockHot className="h-[1.875rem] w-[1.875rem] sm:h-11 sm:w-11" />
                  ) : session.speed == "normal" ? (
                    <ClockNormal className="h-[1.875rem] w-[1.875rem] sm:h-11 sm:w-11" />
                  ) : (
                    <ClockCold className="h-[1.875rem] w-[1.875rem] sm:h-11 sm:w-11" />
                  )}
                  {session.deck == "normal" ? (
                    <CatDevil className="h-[1.875rem] w-[1.875rem] sm:h-11 sm:w-11" />
                  ) : session.deck == "twitchfriendly" ? (
                    <CatTwitch className="h-[1.875rem] w-[1.875rem] sm:h-11 sm:w-11" />
                  ) : session.deck == "custom" ? (
                    <CatDealer className="h-[1.875rem] w-[1.875rem] sm:h-11 sm:w-11" />
                  ) : null}
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

export default AvailableSessions
