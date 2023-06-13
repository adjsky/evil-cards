import { SequentialRoundRobin } from "round-robin-js"
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

  return containers
    .filter((container) => container.Labels["balancer-target"] == env.TARGET)
    .map((container) =>
      Number(container.Labels["com.docker.compose.container-number"])
    )
    .filter((containerNumber) => !isNaN(containerNumber))
}

export default setupRoundRobin
