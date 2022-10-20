import dynamic from "next/dynamic"
import { useAtom } from "jotai"
import Router from "next/router"

import { gameStateAtom } from "../atoms"
import useSocket from "../hooks/use-socket"
import useSnackbar from "../components/snackbar/use"
import mapErrorMessage from "../functions/map-error-message"

import Entry from "../screens/entry"

import type { NextPage } from "next"
import type { Message as SendMessage } from "@kado/schemas/dist/client/send"
import type { Message as ReceiveMessage } from "@kado/schemas/dist/client/receive"

const Game = dynamic(() => import("../screens/game"), { ssr: false })
const Waiting = dynamic(() => import("../screens/waiting"), { ssr: false })

const Home: NextPage = () => {
  const { updateSnackbar, Snackbar } = useSnackbar()
  const [gameState, setGameState] = useAtom(gameStateAtom)
  const sessionState = gameState?.session.state
  useSocket<SendMessage, ReceiveMessage>({
    onClose() {
      setGameState(null)
      updateSnackbar({
        message: "Упс, пропало соединение. Пытаемся его восстановить",
        severity: "error",
        open: true
      })
    },
    onJsonMessage(data) {
      if (data.type == "error" && data.details) {
        updateSnackbar({
          message: mapErrorMessage(data.details),
          open: true
        })
      }

      if (data.type == "created" || data.type == "joined") {
        setGameState((prev) => ({
          session: data.details.session,
          userId: data.details.userId,
          whiteCards:
            data.type == "joined" && data.details.whiteCards
              ? data.details.whiteCards
              : prev?.whiteCards ?? []
        }))

        if (data.type == "joined") {
          Router.replace(Router.pathname, undefined, { shallow: true })
        }
      }

      if (!gameState) {
        return
      }

      if (
        data.type == "gamestart" ||
        data.type == "choose" ||
        data.type == "choosingbeststarted" ||
        data.type == "disconnected" ||
        data.type == "gameend"
      ) {
        setGameState({ ...gameState, session: data.details.session })
      }

      if (
        data.type == "voted" ||
        data.type == "votingstarted" ||
        data.type == "choosingstarted"
      ) {
        setGameState({
          ...gameState,
          session: data.details.session,
          whiteCards: data.details.whiteCards
        })
      }
    }
  })

  const waiting =
    sessionState == "waiting" ||
    sessionState == "end" ||
    sessionState == "starting"

  return (
    <>
      {Snackbar}
      {!gameState && <Entry />}
      {waiting && <Waiting />}
      {!waiting && <Game />}
    </>
  )
}

export default Home
