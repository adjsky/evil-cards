import { env } from "./env.ts"

function makeURLFromServer(server: number) {
  return env.PATTERN.replace("{}", server.toString())
}

export default makeURLFromServer
