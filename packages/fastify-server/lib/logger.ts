export type Options = {
  loki?: {
    name: string
    host: string
    basicAuth?: {
      username: string
      password: string
    }
  }
  pretty?: boolean
  enabled?: boolean
}

function getLogger(options: Options) {
  if (!options.enabled) {
    return false
  }

  if (options.pretty) {
    return {
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname"
        }
      }
    }
  }

  if (options.loki) {
    return {
      transport: {
        target: "pino-loki",
        options: {
          batching: true,
          interval: 5,

          labels: { app: options.loki.name },

          host: options.loki.host,
          basicAuth: options.loki.basicAuth
        }
      }
    }
  }

  return true
}

export default getLogger
