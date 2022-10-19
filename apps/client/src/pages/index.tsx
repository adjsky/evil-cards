import Entry from "../screens/entry"
import Waiting from "../screens/waiting"
import Game from "../screens/game"

import type { NextPage } from "next"

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
