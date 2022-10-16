import { useEffect } from "react"
import type { NextPage } from "next"

const Home: NextPage = () => {
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000")

    ws.addEventListener("open", () => {
      ws.send(
        JSON.stringify({
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
