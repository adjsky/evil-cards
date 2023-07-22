import Entry from "@/screens/entry"
import Router from "next/router"
import { useEffect } from "react"

import type { NextPage } from "next"

const Home: NextPage = () => {
  useEffect(() => {
    Router.prefetch("/room")
  }, [])

  return <Entry />
}

export default Home
