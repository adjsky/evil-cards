import ky, { HTTPError } from "ky"
import { fromPromise } from "resulto"

type SuccessLoadBalancerResponse = {
  message: "ok"
  host: string
}

function getWsHost(sessionId?: string) {
  return fromPromise(
    ky
      .get(import.meta.env.VITE_LOAD_BALANCER_PATH, {
        searchParams: sessionId
          ? {
              sessionId
            }
          : undefined
      })
      .json<SuccessLoadBalancerResponse>()
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
