import "../styles/globals.css"
import { useAtom, useAtomValue } from "jotai"
import Router from "next/router"
import { usePanelbear } from "@panelbear/panelbear-nextjs"

import { gameStateAtom, soundsAtom } from "../atoms"
import useSocket from "../hooks/use-socket"
import useSnackbar from "../components/snackbar/use"
import mapErrorMessage from "../functions/map-error-message"
import { processMessageAndPlayAudio } from "../audio"
import { env } from "../env/client.mjs"

import type { AppType } from "next/dist/shared/lib/utils"
import type { Message as SendMessage } from "@evil-cards/server/src/lib/ws/receive"
import type { Message as ReceiveMessage } from "@evil-cards/server/src/lib/ws/send"

const useSocketEvents = () => {
  const { updateSnackbar, Snackbar } = useSnackbar()
  const [gameState, setGameState] = useAtom(gameStateAtom)
  const sounds = useAtomValue(soundsAtom)

  const onClose = () => {
    setGameState(null)
    updateSnackbar({
      message: "Упс, пропало соединение. Пытаемся его восстановить",
      severity: "error",
      open: true,
      infinite: true
    })
  }
  const onOpen = () => {
    updateSnackbar((prev) => ({ ...prev, open: false }))
  }
  const onJsonMessage = (message: ReceiveMessage) => {
    if (message.type == "error" && message.details) {
      updateSnackbar({
        message: mapErrorMessage(message.details),
        open: true,
        infinite: false
      })
    }

    if (message.type == "joined" || message.type == "created") {
      Router.push("/room", undefined, { shallow: true })
    }

    if (
      message.type == "error" &&
      message.details &&
      message.details == "session not found"
    ) {
      Router.replace("/", undefined, { shallow: true })
    }

    if (gameState?.configuration.reader == "on" && sounds) {
      processMessageAndPlayAudio(message)
    }

    switch (message.type) {
      case "joined":
        setGameState({
          ...message.details.changedState,
          votes: [],
          winners: null
        })
        break
      case "created":
        setGameState({
          ...message.details.changedState,
          redCard: null,
          votes: [],
          whiteCards: [],
          votingEndsAt: null,
          winners: null
        })
        break
      case "votingstarted":
        setGameState((prev) => ({ ...prev!, ...message.details.changedState }))
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
              message.details.changedState.users.length >= 3
            ) {
              winners = [...message.details.changedState.users]
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)
            }

            return {
              ...prev,
              ...message.details.changedState,
              votingEndsAt:
                message.type == "choosingstarted" ? null : prev.votingEndsAt,
              winners
            }
          })
        }
    }
  }

  useSocket<SendMessage, ReceiveMessage>({
    onClose,
    onOpen,
    onJsonMessage
  })

  return { Snackbar }
}

const MyApp: AppType = ({ Component, pageProps }) => {
  usePanelbear(env.NEXT_PUBLIC_ANAL_KEY, {
    enabled: env.NEXT_PUBLIC_IS_PRODUCTION
  })
  const { Snackbar } = useSocketEvents()

  return (
    <>
      {Snackbar}
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
