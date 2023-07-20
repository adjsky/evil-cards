import { env } from "../env/client.mjs"
import { fromPromise } from "neverthrow"
import ky, { HTTPError } from "ky"

type SuccessLoadBalancerResponse = {
  message: "ok"
  host: string
}

function getWsHost(sessionId?: string) {
  return fromPromise(
    ky
      .get(env.NEXT_PUBLIC_BALANCER_PATH, {
        searchParams: sessionId
          ? {
              sessionId
            }
          : undefined
      })
      .json<SuccessLoadBalancerResponse>(),
    (err) => err
  )
    .mapErr((err) => {
      console.error(err)

      if (err instanceof HTTPError && err.response.status == 404) {
        return "nosession"
      }

      return "fetcherror"
    })
    .map((response) => response.host)
}

export default getWsHost
