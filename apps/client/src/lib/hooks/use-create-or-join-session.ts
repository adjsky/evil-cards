import { useState } from "react"
import EasySpeech from "easy-speech"
import { useRouter } from "next/router"
import { useAtomValue } from "jotai"

import { nicknameAtom, avatarAtom } from "@/lib/atoms"
import { preloadSounds } from "@/lib/audio"
import getWSHost from "@/lib/server/get-ws-host"

import { updateSnackbar } from "@/components/snackbar/use"

import packageJson from "../../../package.json"
import useSessionSocket from "./use-session-socket"

const errorsToIgnore = ["nickname is taken"]

const startErrors = {
  nosession: "Комната не найдена",
  fetcherror: "Не удалось получить доступные сервера"
}

type Options = {
  onFail?: () => void
}

const useCreateOrJoinSession = (options?: Options) => {
  const [connecting, setConnecting] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const router = useRouter()

  const nickname = useAtomValue(nicknameAtom)
  const avatarId = useAtomValue(avatarAtom)

  const { sendJsonMessage, setUrl, close, resetUrl } = useSessionSocket({
    onJsonMessage(message) {
      if (!connecting) {
        return
      }

      if (message.type == "error" && connecting) {
        setConnecting(false)
        setSessionId(null)
        resetUrl()
        close()
        options?.onFail?.()

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
      if (!connecting) {
        return
      }

      updateSnackbar({ open: false })

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
    },
    onClose() {
      setConnecting(false)
      setSessionId(null)
    }
  })

  const createOrJoinSession = async (sessionId?: string) => {
    setConnecting(true)
    setSessionId(sessionId ?? null)

    const result = await getWSHost(sessionId)

    result.match({
      err(error) {
        updateSnackbar({
          message: startErrors[error],
          open: true,
          severity: error == "nosession" ? "information" : "error",
          infinite: false
        })
        setConnecting(false)
        setSessionId(null)

        if (error == "nosession") {
          router.replace("/", undefined, { shallow: true })
        }
      },
      ok(wsHost) {
        setUrl(`${wsHost}/ws/session`)
      }
    })
  }

  return { createOrJoinSession, connecting, sessionId }
}

export default useCreateOrJoinSession
