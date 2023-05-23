import React, { useState, useRef } from "react"
import { useAtomValue, useAtom } from "jotai"
import { useRouter } from "next/router"
import EasySpeech from "easy-speech"
import packageJson from "../../package.json"

import { preloadSounds } from "@/lib/audio"
import { nicknameAtom, avatarAtom } from "@/lib/atoms"
import { useSessionSocket, useScreenFactor } from "@/lib/hooks"
import { usePreviousPathname } from "@/lib/contexts/previous-pathname"
import { AVAILABLE_AVATARS } from "@/lib/data/constants"
import getWSHost from "@/lib/server/get-ws-host"
import { updateSnackbar } from "@/components/snackbar/use"
import isBrowserUnsupported from "@/lib/functions/is-browser-unsupported"

import Button from "@/components/button"
import NicknameInput from "@/components/nickname-input"
import FadeIn from "@/components/fade-in"
import Arrow from "@/assets/arrow.svg"
import Logo from "@/components/logo"
import Loader from "@/components/loader"
import AvailableSessions from "@/components/available-sessions"

const errorsToIgnore = ["nickname is taken"]

const Entry: React.FC = () => {
  const [waiting, setWaiting] = useState(false)
  const router = useRouter()
  const unsupported = useRef(isBrowserUnsupported())

  const [screenStyles, containerRef] = useScreenFactor({
    px: 40,
    py: 40,
    disableOnMobile: true
  })
  const { sendJsonMessage, updateUrl } = useSessionSocket({
    onJsonMessage(message) {
      if (message.type == "error" && waiting) {
        setWaiting(false)
        updateUrl(null)

        let ignore = false

        if (message.details && errorsToIgnore.includes(message.details)) {
          ignore = true
        }

        if (!ignore) {
          router.replace("/", undefined, { shallow: true })
        }
      } else if (message.type == "join" || message.type == "create") {
        router.push("/room", undefined, { shallow: true })

        preloadSounds()
        EasySpeech.init().catch((error) => console.error(error))
      }
    },
    onOpen() {
      updateSnackbar({ open: false })
    },
    onClose() {
      setWaiting(false)
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
        updateSnackbar({
          message: startErrors[error],
          open: true,
          severity: error == "nosession" ? "information" : "error",
          infinite: false
        })
        setWaiting(false)

        if (error == "nosession") {
          router.replace("/", undefined, { shallow: true })
        }
      },
      ok(wsHost) {
        updateUrl(`${wsHost}/ws/session`)

        if (sessionId) {
          sendJsonMessage({
            type: "joinsession",
            details: {
              nickname,
              sessionId,
              avatarId,
              appVersion: packageJson.version
            }
          })
        } else {
          sendJsonMessage({
            type: "createsession",
            details: {
              nickname,
              avatarId,
              appVersion: packageJson.version
            }
          })
        }
      }
    })
  }

  const disabled = waiting || unsupported.current

  return (
    <FadeIn
      className="flex h-full items-center justify-center"
      disabled={previousPathname != "/room"}
      duration={100}
    >
      <div
        ref={containerRef}
        style={screenStyles}
        className="flex flex-col items-center justify-center gap-8 sm:h-[30.625rem] sm:w-[21.25rem]"
      >
        <Logo />
        <UserCard />
        <div className="flex gap-2">
          {!joining && <AvailableSessions />}
          <Button
            variant="filled"
            onClick={handleStart}
            className="h-12 w-32 uppercase"
            disabled={disabled}
            data-testid="connect-session"
          >
            {waiting ? <Loader /> : "Играть"}
          </Button>
        </div>
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

const startErrors = {
  nosession: "Комната не найдена",
  fetcherror: "Не удалось получить доступные сервера"
}

export default Entry
