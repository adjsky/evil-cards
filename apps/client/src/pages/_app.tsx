import "../styles/globals.css"
import { useAtom } from "jotai"
import Router from "next/router"

import { gameStateAtom, soundsAtom } from "../atoms"
import useSocket from "../hooks/use-socket"
import useSnackbar from "../components/snackbar/use"
import mapErrorMessage from "../functions/map-error-message"
import speak from "../functions/speak"

import type { AppType } from "next/dist/shared/lib/utils"
import type { Message as SendMessage } from "@evil-cards/server/src/lib/ws/receive"
import type { Message as ReceiveMessage } from "@evil-cards/server/src/lib/ws/send"

const MyApp: AppType = ({ Component, pageProps }) => {
  const { updateSnackbar, Snackbar } = useSnackbar()
  const [gameState, setGameState] = useAtom(gameStateAtom)
  const sounds = useAtom(soundsAtom)

  const onClose = () => {
    setGameState(null)
    updateSnackbar({
      message: "Упс, пропало соединение. Пытаемся его восстановить",
      severity: "error",
      open: true
    })
  }
  const onJsonMessage = (data: ReceiveMessage) => {
    if (data.type == "error" && data.details) {
      updateSnackbar({
        message: mapErrorMessage(data.details),
        open: true
      })
    }

    if (data.type == "joined" || data.type == "created") {
      Router.push("/room", undefined, { shallow: true })
    }

    if (
      data.type == "error" &&
      data.details &&
      data.details == "session not found"
    ) {
      Router.replace("/", undefined, { shallow: true })
    }

    if (data.type == "votingstarted") {
      if (gameState?.configuration.reader == "off" || !sounds) {
        return
      }

      speak(data.details.redCard)
    }

    switch (data.type) {
      case "joined":
        setGameState({
          ...data.details,
          votes: [],
          winners: null
        })
        break
      case "created":
        setGameState({
          ...data.details,
          redCard: null,
          votes: [],
          whiteCards: [],
          votingEndsAt: null,
          winners: null
        })
        break
      case "votingstarted":
        setGameState((prev) => ({ ...prev!, ...data.details }))
        break
      default:
        if (data.type != "ping" && data.type != "error") {
          setGameState((prev) => {
            if (!prev) {
              return null
            }

            let winners = prev.winners
            if (data.type == "gameend" && data.details.users.length >= 3) {
              winners = [...data.details.users]
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)
            }

            return {
              ...prev,
              ...data.details,
              votingEndsAt:
                data.type == "choosingstarted" ? null : prev.votingEndsAt,
              winners
            }
          })
        }
    }
  }

  useSocket<SendMessage, ReceiveMessage>({
    onClose,
    onJsonMessage
  })

  return (
    <>
      {Snackbar}
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
