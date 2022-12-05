import { useEffect } from "react"
import { useAtomValue } from "jotai"
import Router from "next/router"

import { gameStateAtom } from "@/atoms"

import Game from "@/screens/game"
import Waiting from "@/screens/waiting"
import ClientOnly from "@/components/client-only"

import type { NextPage } from "next"

const Room: NextPage = () => {
  const gameState = useAtomValue(gameStateAtom)

  useEffect(() => {
    if (!gameState) {
      Router.push("/")
    }
  }, [gameState])

  if (!gameState) {
    return null
  }

  const gameStatus = gameState.status
  const waiting =
    gameStatus == "waiting" || gameStatus == "end" || gameStatus == "starting"
  const playing = !waiting

  return (
    <ClientOnly>
      {gameState && waiting && <Waiting gameState={gameState} />}
      {gameState && playing && <Game gameState={gameState} />}
    </ClientOnly>
  )
}

export default Room
