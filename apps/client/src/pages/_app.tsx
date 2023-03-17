import "@/styles/globals.css"
import Head from "next/head"
import { useAtom, useAtomValue } from "jotai"
import { useRouter } from "next/router"
import PlausibleProvider from "next-plausible"

import getMetaTags from "@/lib/seo"
import { gameStateAtom, soundsAtom } from "@/lib/atoms"
import { useSocket } from "@/lib/hooks"
import { PreviousPathnameProvider } from "@/lib/contexts/previous-pathname"
import { useSnackbar, updateSnackbar } from "@/components/snackbar/use"
import { mapErrorMessage } from "@/lib/functions"
import { processMessageAndSpeak, processMessageAndPlaySound } from "@/lib/audio"
import { env } from "@/lib/env/client.mjs"

import type { AppProps } from "next/app"
import type { Message as SendMessage } from "@evil-cards/server/src/lib/ws/receive"
import type { Message as ReceiveMessage } from "@evil-cards/server/src/lib/ws/send"

const MyApp = ({ Component, pageProps }: AppProps) => {
  const { Snackbar } = useSocketEvents()
  const router = useRouter()

  return (
    <>
      <Head>{getMetaTags(router.asPath)}</Head>
      <PlausibleProvider
        domain={env.NEXT_PUBLIC_PRODUCTION_HOST}
        enabled={env.NEXT_PUBLIC_WITH_ANALYTICS}
        customDomain={`https://analytics.${env.NEXT_PUBLIC_PRODUCTION_HOST}`}
        selfHosted
      >
        <PreviousPathnameProvider>
          {Snackbar}
          <Component {...pageProps} />
        </PreviousPathnameProvider>
      </PlausibleProvider>
    </>
  )
}

const useSocketEvents = () => {
  const Snackbar = useSnackbar()
  const [gameState, setGameState] = useAtom(gameStateAtom)
  const sounds = useAtomValue(soundsAtom)

  useSocket<SendMessage, ReceiveMessage>({
    onJsonMessage(message) {
      if (message.type == "error" && message.details) {
        updateSnackbar({
          message: mapErrorMessage(message.details),
          open: true,
          infinite: false
        })
      }

      if (sounds) {
        if (gameState?.configuration.reader == "on") {
          processMessageAndSpeak(message)
        }

        processMessageAndPlaySound(message)
      }

      switch (message.type) {
        case "join":
          setGameState({
            ...message.details.changedState,
            votes: [],
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
        case "votingstart":
          setGameState((prev) => ({
            ...prev!,
            ...message.details.changedState
          }))
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

              return {
                ...prev,
                ...message.details.changedState,
                votingEndsAt:
                  message.type == "choosingstart" ? null : prev.votingEndsAt,
                winners
              }
            })
          }
      }
    },
    onClose(_, manually) {
      if (manually || gameState == null) {
        return
      }

      setGameState(null)
      updateSnackbar({
        message:
          "Упс, пропало соединение. Проверьте ваше соединение и попробуйте зайти в игру снова",
        severity: "error",
        open: true
      })
    }
  })

  return { Snackbar }
}

export default MyApp
