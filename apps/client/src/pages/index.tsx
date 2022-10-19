import dynamic from "next/dynamic"

import Entry from "../screens/entry"

import type { NextPage } from "next"

const Game = dynamic(() => import("../screens/game"), { ssr: false })
const Waiting = dynamic(() => import("../screens/waiting"), { ssr: false })

const Home: NextPage = () => {
  return (
    <>
      <Entry />
      <Waiting />
      <Game />
    </>
  )
}

export default Home
