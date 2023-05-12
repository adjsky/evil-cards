import { env } from "../env/client.mjs"
import { ok, err } from "@evil-cards/fp"

import type { Result } from "@evil-cards/fp"

type Error = "nosession" | "fetcherror"

type SuccessLoadBalancerResponse = {
  message: "ok"
  host: string
}

async function getWsHost(sessionId?: string): Promise<Result<string, Error>> {
  if (env.NEXT_PUBLIC_WS_HOST) {
    return ok(env.NEXT_PUBLIC_WS_HOST)
  }

  let loadBalancerPath = "/api/server"
  if (sessionId) {
    loadBalancerPath += `?sessionId=${sessionId}`
  }

  try {
    const response = await fetch(loadBalancerPath)

    if (response.status == 404) {
      return err("nosession")
    }

    const parsedResponse: SuccessLoadBalancerResponse = await response.json()

    return ok(parsedResponse.host)
  } catch (error) {
    console.error(error)

    return err("fetcherror")
  }
}

export default getWsHost
