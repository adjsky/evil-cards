import EasySpeech from "easy-speech"
import { useAtomValue, useSetAtom } from "jotai"
import { useRouter } from "next/router"
import { useState } from "react"

import raise from "@/core/raise"

import { sessionAtom } from "@/lib/atoms/session"
import { preloadSounds } from "@/lib/audio"
import getWSHost from "@/lib/server/get-ws-host"

import { updateSnackbar } from "@/components/snackbar/use"

import packageJson from "../../../package.json"
import { renderAdv } from "../adv"
import { avatarAtom, nicknameAtom } from "../atoms/game"
import useSessionSocket from "./use-session-socket"

const errorsToIgnore = ["Nickname is taken"]

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

  const setSession = useSetAtom(sessionAtom)

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
        const { configuration, id, playerId, players, ...gameState } =
          message.details.changedState

        const player = players.find((player) => player.id == playerId)

        setSession({
          configuration,
          id,
          players,
          player:
            player ?? raise(`Expected to find player in the players list`),
          chat: [],
          ...(gameState.status == "voting" ||
          gameState.status == "choosing" ||
          gameState.status == "choosingwinner" ||
          gameState.status == "winnercardview"
            ? {
                playing: true,
                gameState: {
                  status: gameState.status,
                  deck: gameState.deck,
                  redCard: gameState.redCard,
                  votes: gameState.votes,
                  votingEndsAt: gameState.votingEndsAt
                }
              }
            : {
                playing: false,
                gameState: {
                  status: gameState.status
                }
              })
        })

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

    await renderAdv().catch(console.error)

    setSessionId(sessionId ?? null)

    getWSHost(sessionId).match(
      (wsHost) => setUrl(`${wsHost}/ws/session`),
      (err) => {
        updateSnackbar({
          message: startErrors[err],
          open: true,
          severity: err == "nosession" ? "information" : "error",
          infinite: false
        })
        setConnecting(false)
        setSessionId(null)

        if (err == "nosession") {
          router.replace("/", undefined, { shallow: true })
        }
      }
    )
  }

  return { createOrJoinSession, connecting, sessionId }
}

export default useCreateOrJoinSession
