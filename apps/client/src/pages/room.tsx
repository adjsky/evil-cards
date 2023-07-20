import Game from "@/screens/game"
import Waiting from "@/screens/waiting"
import { useAtom } from "jotai"
import Router from "next/router"
import { useEffect } from "react"

import { sessionAtom } from "@/lib/atoms/session"

import type { NextPage } from "next"

const Room: NextPage = () => {
  const [session] = useAtom(sessionAtom)

  useEffect(() => {
    if (!session) {
      Router.push("/")
    }
  }, [session])

  if (!session) {
    return null
  }

  return (
    <>
      {!session.playing && <Waiting />}
      {session.playing && <Game />}
    </>
  )
}

export default Room
