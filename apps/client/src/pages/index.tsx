import { useEffect } from "react"
import stringify from "../functions/stringify"

import type { NextPage } from "next"

const Home: NextPage = () => {
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000")

    ws.addEventListener("open", () => {
      ws.send(
        stringify({
          type: "createsession",
          details: {
            username: "Asdasd"
          }
        })
      )
    })
  }, [])

  return <></>
}

export default Home
