import EasySpeech from "easy-speech"
import { useAtomValue, useSetAtom } from "jotai"
import { useState } from "react"

import raise from "@/core/raise"

import { sessionAtom } from "@/lib/atoms/session"
import { preloadSounds } from "@/lib/audio"
import getWSHost from "@/lib/functions/get-ws-host"

import { hideNotifications, notify } from "@/components/snackbar"

import packageJson from "../../../package.json"
import { renderAdv } from "../adv"
import { avatarAtom, nicknameAtom } from "../atoms/game"
import useSessionSocket from "./use-session-socket"

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

  const nickname = useAtomValue(nicknameAtom)
  const avatarId = useAtomValue(avatarAtom)

  const { sendJsonMessage, setUrl, closeSocket, resetSocketUrl } =
    useSessionSocket({
      onJsonMessage(message) {
        if (!connecting) {
          return
        }

        if (message.type == "error" && connecting) {
          setConnecting(false)
          setSessionId(null)
          resetSocketUrl()
          closeSocket()
          options?.onFail?.()
        }

        if (message.type == "join" || message.type == "create") {
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

          history.replaceState("", "", "/")

          preloadSounds()
          EasySpeech.init().catch((error) => console.error(error))
        }
      },
      onOpen() {
        if (!connecting) {
          return
        }

        hideNotifications()

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
      (wsHost) => {
        setUrl(`${wsHost}/ws/session`)
      },
      (err) => {
        notify({
          message: startErrors[err],
          severity: err == "nosession" ? "information" : "error",
          infinite: false
        })
        setConnecting(false)
        setSessionId(null)

        if (err == "nosession") {
          history.replaceState("", "", "/")
        }
      }
    )
  }

  return { createOrJoinSession, connecting, sessionId }
}

export default useCreateOrJoinSession
