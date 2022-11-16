import Entry from "../screens/entry"
import ClientOnly from "../components/client-only"

import type { NextPage } from "next"

const Home: NextPage = () => {
  return (
    <ClientOnly>
      <Entry />
    </ClientOnly>
  )
}

export default Home
