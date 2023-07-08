import { SequentialRoundRobin } from "round-robin-js"

import { log } from "@evil-cards/core/fastify"

import { env } from "./env.ts"

import type Docker from "dockerode"

const INTERVAL_MS = 30 * 1000 // 30s

async function setupRoundRobin(docker: Docker) {
  const roundRobin = new SequentialRoundRobin(await getAvailableTargets(docker))

  const interval = setInterval(async () => {
    const targets = await getAvailableTargets(docker)

    roundRobin.clear()
    targets.forEach((target) => roundRobin.add(target))
  }, INTERVAL_MS)

  return {
    roundRobin,
    cleanup() {
      clearInterval(interval)
    }
  }
}

async function getAvailableTargets(docker: Docker) {
  const containers = await docker.listContainers()

  const matchedContainers = containers.filter(
    (container) => container.Labels["balancer-target"] == env.TARGET
  )

  log.info(
    {
      matchedContainers: matchedContainers.map((container) =>
        container.Names.join(" | ")
      )
    },
    "Got available docker targets"
  )

  return matchedContainers
    .map((container) =>
      Number(container.Labels["com.docker.compose.container-number"])
    )
    .filter((containerNumber) => !isNaN(containerNumber))
}

export default setupRoundRobin
