import dynamic from "next/dynamic"
import { useAtom } from "jotai"
import Router from "next/router"

import { gameStateAtom } from "../atoms"
import useSocket from "../hooks/use-socket"
import useSnackbar from "../components/snackbar/use"
import mapErrorMessage from "../functions/map-error-message"

import type { NextPage } from "next"
import type { Message as SendMessage } from "@evil-cards/server/src/lib/ws/receive"
import type { Message as ReceiveMessage } from "@evil-cards/server/src/lib/ws/send"

const Entry = dynamic(() => import("../screens/entry"), { ssr: false })
const Game = dynamic(() => import("../screens/game"), { ssr: false })
const Waiting = dynamic(() => import("../screens/waiting"), { ssr: false })

const Home: NextPage = () => {
  const { updateSnackbar, Snackbar } = useSnackbar()
  const [gameState, setGameState] = useAtom(gameStateAtom)
  const gameStatus = gameState?.status

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

      if (data.type == "joined") {
        Router.replace("/", undefined, { shallow: true })
      }

      switch (data.type) {
        case "joined":
          setGameState({
            ...data.details,
            votes: []
          })
          break
        case "created":
          setGameState({
            ...data.details,
            redCard: null,
            votes: [],
            whiteCards: [],
            votingEndsAt: null
          })
          break
        case "votingstarted":
          setGameState((prev) => ({ ...prev!, ...data.details }))
          break
        default:
          if (data.type != "ping" && data.type != "error")
            setGameState((prev) => ({
              ...prev!,
              ...data.details,
              votingEndsAt: null
            }))
      }
    }
  })

  const waiting =
    gameStatus == "waiting" || gameStatus == "end" || gameStatus == "starting"

  return (
    <>
      {Snackbar}
      {!gameState && <Entry />}
      {gameState && waiting && <Waiting gameState={gameState} />}
      {gameState && !waiting && <Game gameState={gameState} />}
    </>
  )
}

export default Home
