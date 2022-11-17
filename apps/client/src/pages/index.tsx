import { useEffect } from "react"
import Router from "next/router"

import Entry from "../screens/entry"
import ClientOnly from "../components/client-only"

import type { NextPage } from "next"

const Home: NextPage = () => {
  useEffect(() => {
    Router.prefetch("/room")
  }, [])

  return (
    <ClientOnly>
      <Entry />
    </ClientOnly>
  )
}

export default Home
