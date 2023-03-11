import { env } from "../env/client.mjs"
import { ok, err } from "@/core/fp/result"

import type { Result } from "@/core/fp/result"

type Error = "nobalancerpath" | "nosession"

type SuccessLoadBalancerResponse = {
  message: "ok"
  host: string
}

async function getWSHost(sessionId?: string): Promise<Result<string, Error>> {
  if (env.NEXT_PUBLIC_WS_HOST) {
    return ok(env.NEXT_PUBLIC_WS_HOST)
  }

  if (!env.NEXT_PUBLIC_LOAD_BALANCER_PATH) {
    return err("nobalancerpath")
  }

  let loadBalancerPath = env.NEXT_PUBLIC_LOAD_BALANCER_PATH
  if (sessionId) {
    loadBalancerPath += `?sessionId=${sessionId}`
  }

  const response = await fetch(loadBalancerPath)

  if (response.status == 404) {
    return err("nosession")
  }

  const parsedResponse: SuccessLoadBalancerResponse = await response.json()

  return ok(parsedResponse.host)
}

export default getWSHost
