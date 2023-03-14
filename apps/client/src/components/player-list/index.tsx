import React from "react"
import DesktopPlayerList from "./desktop"
import MobilePlayerList from "./mobile"

import type { Player } from "@evil-cards/server/src/lib/ws/send"

const PlayerList: React.FC<{
  players: Player[]
  variant: "game" | "waiting"
}> = ({ players, variant }) => {
  return (
    <>
      <DesktopPlayerList players={players} variant={variant} />
      <MobilePlayerList players={players} variant={variant} />
    </>
  )
}

export default PlayerList
