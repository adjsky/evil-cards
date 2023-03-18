import React, { useState } from "react"
import { useAtomValue, useAtom } from "jotai"
import clsx from "clsx"
import { useRouter } from "next/router"

import { nicknameAtom, avatarAtom } from "@/lib/atoms"
import { useSocket, useScreenFactor } from "@/lib/hooks"
import { usePreviousPathname } from "@/lib/contexts/previous-pathname"
import { AVAILABLE_AVATARS } from "@/lib/data/constants"
import getWSHost from "@/lib/server/get-ws-host"
import { updateSnackbar } from "@/components/snackbar/use"

import NicknameInput from "@/components/nickname-input"
import FadeIn from "@/components/fade-in"
import Arrow from "@/assets/arrow.svg"
import Logo from "@/components/logo"
import Loader from "@/components/loader"

import type { Message as SendMessage } from "@evil-cards/server/src/lib/ws/receive"
import type { Message as ReceiveMessage } from "@evil-cards/server/src/lib/ws/send"

const Entry: React.FC = () => {
  const [waiting, setWaiting] = useState(false)
  const router = useRouter()

  const [screenStyles, containerRef] = useScreenFactor({
    px: 40,
    py: 40,
    disableOnMobile: true
  })
  const { sendJsonMessage, connect, clearMessageQueue } = useSocket<
    SendMessage,
    ReceiveMessage
  >({
    onJsonMessage(message) {
      if (message.type == "error" && waiting) {
        setWaiting(false)
        router.replace("/", undefined, { shallow: true })
      }

      if (message.type == "join" || message.type == "create") {
        router.push("/room", undefined, { shallow: true })
      }
    },
    onClose(_, manually) {
      if (manually) {
        return
      }

      setWaiting(false)
      clearMessageQueue()

      updateSnackbar({
        message: "Не удалось подключиться к серверу",
        open: true,
        severity: "error"
      })
    }
  })

  const previousPathname = usePreviousPathname()

  const nickname = useAtomValue(nicknameAtom)
  const avatarId = useAtomValue(avatarAtom)

  const searchParams = new URLSearchParams(window.location.search)
  const joining = searchParams.has("s")

  const handleStart = async () => {
    setWaiting(true)

    const sessionId = searchParams.get("s")

    const result = await getWSHost(sessionId ?? undefined)

    result.match({
      err(error) {
        const message =
          error == "nosession"
            ? "Комната не найдена"
            : "Произошла какая-то ошибка"

        updateSnackbar({ message, open: true, severity: "information" })
        setWaiting(false)
      },
      ok(wsHost) {
        connect(wsHost)

        if (sessionId) {
          sendJsonMessage({
            type: "joinsession",
            details: {
              nickname,
              sessionId,
              avatarId
            }
          })
        } else {
          sendJsonMessage({
            type: "createsession",
            details: {
              nickname,
              avatarId
            }
          })
        }
      }
    })
  }

  return (
    <FadeIn
      className="flex h-full items-center justify-center"
      disabled={previousPathname != "/room"}
      duration={100}
    >
      <div
        ref={containerRef}
        style={screenStyles}
        className="flex flex-col items-center justify-center gap-8 sm:w-[20.625rem]"
      >
        <Logo />
        <UserCard />
        <button
          onClick={handleStart}
          className={clsx(
            "flex h-12 w-32 items-center justify-center rounded-lg bg-red-500 text-xl leading-none text-gray-100",
            "transition-colors enabled:hover:bg-gray-100 enabled:hover:text-red-500",
            waiting && "opacity-80"
          )}
          disabled={waiting}
          data-testid="connect-session"
        >
          {waiting ? <Loader /> : joining ? "ВОЙТИ" : "НАЧАТЬ"}
        </button>
      </div>
    </FadeIn>
  )
}

const UserCard: React.FC = () => {
  const [nickname, setNickname] = useAtom(nicknameAtom)
  const [avatarId, setAvatarId] = useAtom(avatarAtom)

  return (
    <div className="flex aspect-[0.71942446043] w-48 flex-col items-center justify-center gap-5 rounded-lg bg-gray-100 pt-3">
      <div className="rounded-full border-[2px] border-gray-900 p-[2px]">
        <div className="relative">
          <button
            onClick={() =>
              setAvatarId((prev) => (prev == AVAILABLE_AVATARS ? 1 : prev + 1))
            }
            className="absolute -right-5 top-1/2 flex h-[25px] w-[25px] -translate-y-1/2 items-center justify-center rounded-full bg-gray-900"
            data-testid="avatar-next"
          >
            <Arrow className="rotate-180" />
          </button>
          <div
            style={{
              width: 120,
              height: 120,
              backgroundImage: `url(/avatars/${avatarId}.svg)`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover"
            }}
            data-testid="avatar"
          />
          <button
            onClick={() =>
              setAvatarId((prev) => (prev == 1 ? AVAILABLE_AVATARS : prev - 1))
            }
            className="absolute -left-5 top-1/2 flex h-[25px] w-[25px] -translate-y-1/2 items-center justify-center rounded-full bg-gray-900"
            data-testid="avatar-prev"
          >
            <Arrow />
          </button>
        </div>
      </div>
      <NicknameInput value={nickname} onChange={setNickname} />
    </div>
  )
}

export default Entry
