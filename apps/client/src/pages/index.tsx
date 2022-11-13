import { useAtom } from "jotai"
import Router from "next/router"

import { gameStateAtom } from "../atoms"
import useSocket from "../hooks/use-socket"
import useSnackbar from "../components/snackbar/use"
import mapErrorMessage from "../functions/map-error-message"

import Entry from "../screens/entry"
import Game from "../screens/game"
import Waiting from "../screens/waiting"

import type { NextPage } from "next"
import type { Message as SendMessage } from "@evil-cards/server/src/lib/ws/receive"
import type { Message as ReceiveMessage } from "@evil-cards/server/src/lib/ws/send"

const Home: NextPage = () => {
  const { updateSnackbar, Snackbar } = useSnackbar()
  const [gameState, setGameState] = useAtom(gameStateAtom)

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

      if (
        data.type == "joined" ||
        (data.type == "error" &&
          data.details &&
          data.details == "session not found")
      ) {
        Router.replace("/", undefined, { shallow: true })
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
                winners = data.details.users
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
  })

  const gameStatus = gameState?.status
  const waiting =
    gameStatus == "waiting" || gameStatus == "end" || gameStatus == "starting"
  const playing = gameStatus != undefined && !waiting

  return (
    <>
      {Snackbar}
      {gameState == null && <Entry />}
      {gameState && waiting && <Waiting gameState={gameState} />}
      {gameState && playing && <Game gameState={gameState} />}
    </>
  )
}

export default Home
