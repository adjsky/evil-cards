import dynamic from "next/dynamic"
import Entry from "../screens/entry"
import { useSocket } from "../ws/hooks"
import type { NextPage } from "next"

const Game = dynamic(() => import("../screens/game"), { ssr: false })
const Waiting = dynamic(() => import("../screens/waiting"), { ssr: false })

const Home: NextPage = () => {
  useSocket({
    onError(event) {
      console.log(event)
    },
    onClose(event) {
      console.log(event)
    },
    onConnectionLost() {
      console.log("lost connection")
    }
  })

  return (
    <>
      <Entry />
      <Waiting />
      <Game />
    </>
  )
}

export default Home
