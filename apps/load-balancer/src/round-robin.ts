import { SequentialRoundRobin } from "round-robin-js"

import { log } from "@evil-cards/core/fastify"

import { env } from "./env.ts"

import type Docker from "dockerode"

export async function setupRoundRobin(docker: Docker) {
  return new SequentialRoundRobin(await getAvailableServers(docker))
}

export async function updateRoundRobin(
  docker: Docker,
  roundRobin: SequentialRoundRobin<number>,
  version: string
) {
  const targets = await getAvailableServers(docker, version)

  roundRobin.clear()
  targets.forEach((target) => roundRobin.add(target))
}

async function getAvailableServers(docker: Docker, version?: string) {
  const containers = await docker.listContainers()

  const servers = containers
    .filter(
      (container) =>
        container.Labels["balancer-target"] == env.TARGET &&
        (version ? container.Labels["version"] == version : true) &&
        container.State == "running"
    )
    .map((container) =>
      Number(container.Labels["com.docker.compose.container-number"])
    )

  log.info(
    {
      servers
    },
    "Received available servers"
  )

  return servers
}
