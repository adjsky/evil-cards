import "@/styles/globals.css"
import React, { useEffect } from "react"
import Head from "next/head"
import { useAtom, useAtomValue } from "jotai"
import SingletonRouter, { useRouter } from "next/router"
import PlausibleProvider from "next-plausible"
import packageJson from "../../package.json"

import getMetaTags from "@/lib/seo"
import { gameStateAtom, soundsAtom, reconnectingGameAtom } from "@/lib/atoms"
import { useSessionSocket } from "@/lib/hooks"
import { PreviousPathnameProvider } from "@/lib/contexts/previous-pathname"
import { useSnackbar, updateSnackbar } from "@/components/snackbar/use"
import { mapErrorMessage } from "@/lib/functions"
import { processMessageAndSpeak, processMessageAndPlaySound } from "@/lib/audio"
import { env } from "@/lib/env/client.mjs"
import isBrowserUnsupported from "@/lib/functions/is-browser-unsupported"

import ExclamationTriangle from "../assets/exclamation-triangle.svg"
import Modal from "@/components/modal"

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
          {Snackbar}
          <Component {...pageProps} />

          <Reconnecting visible={reconnecting} />
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
      <Modal.Title>Упс, пропало соединение.</Modal.Title>
      <Modal.Description>Пытаемся его восстановить.</Modal.Description>
    </Modal>
  )
}

const useSocketEvents = () => {
  const Snackbar = useSnackbar()

  const [gameState, setGameState] = useAtom(gameStateAtom)
  const sounds = useAtomValue(soundsAtom)

  const [reconnectingGame, setReconnectingGame] = useAtom(reconnectingGameAtom)

  const { sendJsonMessage, updateUrl, clearMessageQueue } = useSessionSocket({
    onJsonMessage(message) {
      if (reconnectingGame) {
        setReconnectingGame(false)

        if (message.type == "error") {
          setGameState(null)

          return
        }
      }

      if (message.type == "error" && message.details) {
        updateSnackbar({
          message: mapErrorMessage(message.details),
          severity: "information",
          open: true,
          infinite: false
        })
      }

      if (sounds) {
        if (gameState?.configuration.reader) {
          processMessageAndSpeak(message)
        }

        processMessageAndPlaySound(message)
      }

      switch (message.type) {
        case "join":
          setGameState({
            ...message.details.changedState,
            winners: null
          })
          break
        case "create":
          setGameState({
            ...message.details.changedState,
            redCard: null,
            votes: [],
            deck: [],
            votingEndsAt: null,
            winners: null
          })
          break
        default:
          if (message.type != "ping" && message.type != "error") {
            setGameState((prev) => {
              if (!prev) {
                return null
              }

              let winners = prev.winners
              if (
                message.type == "gameend" &&
                message.details.changedState.players.length >= 3
              ) {
                winners = [...message.details.changedState.players]
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 3)
              }

              const votingEndsAt =
                message.type == "choosingstart"
                  ? null
                  : "votingEndsAt" in message.details.changedState
                  ? message.details.changedState.votingEndsAt
                  : prev.votingEndsAt

              return {
                ...prev,
                ...message.details.changedState,
                votingEndsAt,
                winners
              }
            })
          }
      }
    },
    onClose(_, { manually, reconnecting }) {
      clearMessageQueue()

      if (!manually && !reconnecting) {
        updateUrl(null)

        updateSnackbar({
          message: "Не удалось подключиться к серверу",
          open: true,
          severity: "error",
          infinite: false
        })
      }

      if (!reconnecting) {
        setGameState(null)
      }

      setReconnectingGame(reconnecting)
    },
    onOpen() {
      if (gameState == null || !reconnectingGame) {
        return
      }

      const player = gameState.players.find(
        (player) => player.id == gameState.playerId
      )

      if (player) {
        sendJsonMessage({
          type: "joinsession",
          details: {
            avatarId: player.avatarId,
            nickname: player.nickname,
            sessionId: gameState.id,
            appVersion: packageJson.version
          }
        })
      }
    },
    shouldReconnect(nReconnects, disconnectedManually) {
      if (nReconnects == 5 || disconnectedManually) {
        return false
      }

      return SingletonRouter.pathname != "/"
    }
  })

  return { Snackbar, reconnecting: reconnectingGame }
}

export default MyApp
