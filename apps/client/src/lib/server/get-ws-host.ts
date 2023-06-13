import { env } from "../env/client.mjs"
import { Result } from "@evil-cards/fp"
import ky, { HTTPError } from "ky"

type Error = "nosession" | "fetcherror"

type SuccessLoadBalancerResponse = {
  message: "ok"
  host: string
}

async function getWsHost(sessionId?: string): Promise<Result<string, Error>> {
  try {
    const response = await ky
      .get(env.NEXT_PUBLIC_BALANCER_PATH, {
        searchParams: sessionId
          ? {
              sessionId
            }
          : undefined
      })
      .json<SuccessLoadBalancerResponse>()

    return Result.ok(response.host)
  } catch (error) {
    console.error(error)

    if (error instanceof HTTPError && error.response.status == 404) {
      return Result.err("nosession")
    }

    return Result.err("fetcherror")
  }
}

export default getWsHost
