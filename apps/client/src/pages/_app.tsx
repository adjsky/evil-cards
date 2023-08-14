import "@/styles/globals.css"
import { useAtom, useAtomValue } from "jotai"
import PlausibleProvider from "next-plausible"
import Head from "next/head"
import SingletonRouter, { useRouter } from "next/router"
import { omit } from "ramda"
import React, { useEffect } from "react"

import raise from "@/core/raise"

import { soundsAtom } from "@/lib/atoms/game"
import { reconnectingSessionAtom, sessionAtom } from "@/lib/atoms/session"
import { processMessageAndPlaySound, processMessageAndSpeak } from "@/lib/audio"
import { PreviousPathnameProvider } from "@/lib/contexts/previous-pathname"
import { env } from "@/lib/env/client.mjs"
import { mapErrorMessage } from "@/lib/functions"
import isBrowserUnsupported from "@/lib/functions/is-browser-unsupported"
import { useSessionSocket } from "@/lib/hooks"
import getMetaTags from "@/lib/seo"

import ClientOnly from "@/components/client-only"
import Modal from "@/components/modal"
import { updateSnackbar, useSnackbar } from "@/components/snackbar/use"

import packageJson from "../../package.json"
import ExclamationTriangle from "../assets/exclamation-triangle.svg"

import type { AppProps } from "next/app"

const MyApp = ({ Component, pageProps }: AppProps) => {
  const { Snackbar, reconnecting } = useSocketEvents()
  const router = useRouter()

  useEffect(() => {
    const shouldNotify = isBrowserUnsupported()

    if (shouldNotify) {
      updateSnackbar({
        message:
          "Похоже, что вы используете неподдерживаемый браузер. Вы не сможете начать игру",
        open: true,
        severity: "information",
        infinite: true
      })
    }
  }, [])

  const domain = new URL(env.NEXT_PUBLIC_SITE_HOST).host

  return (
    <>
      <Head>{getMetaTags(router.asPath)}</Head>
      <PlausibleProvider
        domain={domain}
        enabled={env.NEXT_PUBLIC_WITH_ANALYTICS}
        customDomain={`https://analytics.${domain}`}
        selfHosted
      >
        <PreviousPathnameProvider>
          <ClientOnly>
            {Snackbar}
            <Component {...pageProps} />

            <Reconnecting visible={reconnecting} />
          </ClientOnly>
        </PreviousPathnameProvider>
      </PlausibleProvider>
    </>
  )
}

const Reconnecting: React.FC<{ visible?: boolean }> = ({ visible }) => {
  return (
    <Modal
      isOpen={visible}
      className="flex flex-col items-center text-xl font-medium text-gray-100"
    >
      <ExclamationTriangle className="h-24 w-24 animate-pulse fill-red-500" />
      <Modal.Title>Упс, пропало соединение</Modal.Title>
      <Modal.Description>Пытаемся его восстановить</Modal.Description>
    </Modal>
  )
}

const useSocketEvents = () => {
  const Snackbar = useSnackbar()

  const [session, setSession] = useAtom(sessionAtom)
  const sounds = useAtomValue(soundsAtom)

  const [reconnectingSession, setReconnectingSession] = useAtom(
    reconnectingSessionAtom
  )

  const { sendJsonMessage, close, resetUrl } = useSessionSocket({
    onClose(event, { gracefully, reconnecting }) {
      if (!reconnecting) {
        setSession(null)
      }

      if (!gracefully && !reconnecting) {
        resetUrl()

        if (isKickCloseEvent(event)) {
          updateSnackbar({
            message: "Вас выгнали из комнаты",
            severity: "information",
            open: true,
            infinite: false
          })
        } else if (isInactiveCloseEvent(event)) {
          updateSnackbar({
            message: "Вы были отключены, так как долго не проявляли активность",
            severity: "information",
            open: true,
            infinite: false
          })
        } else {
          updateSnackbar({
            message: "Не удалось подключиться к серверу",
            open: true,
            severity: "error",
            infinite: false
          })
        }
      }

      setReconnectingSession(reconnecting)
    },
    onOpen() {
      if (session == null || !reconnectingSession) {
        return
      }

      const { player } = session

      if (player) {
        sendJsonMessage({
          type: "joinsession",
          details: {
            avatarId: player.avatarId,
            nickname: player.nickname,
            sessionId: session.id,
            appVersion: packageJson.version
          }
        })
      }
    },
    shouldReconnect(event, { nReconnects, closedGracefully }) {
      if (isKickCloseEvent(event)) {
        return false
      }

      if (isInactiveCloseEvent(event)) {
        return false
      }

      if (nReconnects == 5 || closedGracefully) {
        return false
      }

      return SingletonRouter.pathname != "/"
    },
    onJsonMessage(message) {
      // ---------------------------- HANDLE ERRORS ----------------------------

      if (message.type == "error" && message.details) {
        updateSnackbar({
          message: mapErrorMessage(message.details),
          severity: "information",
          open: true,
          infinite: false
        })
      }

      // ------------------------- HANDLE RECONNECTION -------------------------

      if (reconnectingSession) {
        setReconnectingSession(false)

        if (message.type == "error") {
          setSession(null)
          resetUrl()
          close()

          return
        }
      }

      // ---------------------------- HANDLE AUDIO -----------------------------

      if (sounds) {
        if (session?.configuration.reader) {
          processMessageAndSpeak(message)
        }

        processMessageAndPlaySound(message)
      }

      // --------------------------- SYNC GAME STATE ---------------------------

      switch (message.type) {
        case "playerjoin":
        case "playerleave": {
          setSession((prev) => {
            if (!prev) {
              raise(`Expected session to be defined`)
            }

            const { players } = message.details.changedState

            return {
              ...prev,
              player:
                players.find((player) => player.id == prev.player.id) ??
                raise(`Expected to find player in the players list`),
              players
            }
          })

          break
        }

        case "gamestart":
        case "gameend": {
          setSession((prev) => {
            if (!prev) {
              raise(`Expected session to be defined`)
            }

            const { status, ...rest } = message.details.changedState

            return {
              ...prev,
              ...rest,
              playing: false,
              gameState: {
                status
              }
            }
          })

          break
        }

        case "configurationchange": {
          setSession((prev) => {
            if (!prev) {
              raise(`Expected session to be defined}`)
            }

            return {
              ...prev,
              configuration: message.details.changedState.configuration
            }
          })

          break
        }

        case "votingstart": {
          setSession((prev) => {
            if (!prev) {
              raise(`Expected session to be defined`)
            }

            const { players, ...gameState } = message.details.changedState

            return {
              ...prev,
              player:
                players.find((player) => player.id == prev.player.id) ??
                raise(`Expected to find player in the players list`),
              playing: true,
              players,
              gameState
            }
          })

          break
        }

        case "choosewinner":
        case "choosingwinnerstart":
        case "discardcards":
        case "choosingstart":
        case "winnercardview":
        case "vote":
        case "choose": {
          setSession((prev) => {
            if (!prev || !prev.playing) {
              raise(`Expected session to be defined / in playing state`)
            }

            return {
              ...prev,
              player:
                "players" in message.details.changedState
                  ? message.details.changedState.players.find(
                      (player) => player.id == prev.player.id
                    ) ?? raise(`Expected to find player in the players list`)
                  : prev.player,
              players:
                "players" in message.details.changedState
                  ? message.details.changedState.players
                  : prev.players,
              gameState: {
                ...prev.gameState,
                ...omit(["players"], message.details.changedState),
                votingEndsAt:
                  message.type == "choosingstart"
                    ? null
                    : prev.gameState.votingEndsAt
              }
            }
          })

          break
        }

        case "chat": {
          setSession((prev) => {
            if (!prev) {
              raise(`Expected session to be defined`)
            }

            return {
              ...prev,
              chat: [
                ...prev.chat,
                {
                  id: message.details.id,
                  nickname: message.details.nickname,
                  avatarId: message.details.avatarId,
                  message: message.details.message,
                  read: false
                }
              ]
            }
          })

          break
        }
      }
    }
  })

  return { Snackbar, reconnecting: reconnectingSession }
}

function isKickCloseEvent(event: WebSocketEventMap["close"]) {
  return event.code == 4321 && event.reason == "kick"
}

function isInactiveCloseEvent(event: WebSocketEventMap["close"]) {
  return event.code == 4321 && event.reason == "inactive"
}

export default MyApp
