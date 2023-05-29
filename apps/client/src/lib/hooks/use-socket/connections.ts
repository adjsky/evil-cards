import type { Connection } from "./types"

const connections = new Map<string, Connection>()

export function set(url: string, connection: Connection) {
  return connections.set(url, connection)
}

export function get(url: string) {
  return connections.get(url) ?? null
}

export function getOrDefault(url: string) {
  const connection = connections.get(url)

  if (!connection) {
    const defaultConnection: Connection = {
      closedGracefully: false,
      heartbeatTimeout: null,
      instance: null,
      listeners: [],
      nReconnects: 0,
      reconnectTimeout: null,
      disconnectTimeout: null
    }

    connections.set(url, defaultConnection)

    return defaultConnection
  }

  return connection
}
