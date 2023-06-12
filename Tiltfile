docker_compose("./deploy/compose/docker-compose.dev.yml")

docker_build(
  ref="tilt/server",
  context=".",
  dockerfile="./deploy/dockerfiles/Dockerfile.server",
  target="runner-dev"
)

docker_build(
  ref="tilt/load-balancer",
  context=".",
  dockerfile="./deploy/dockerfiles/Dockerfile.load-balancer",
  target="runner-dev"
)

docker_build(
  ref="tilt/client",
  context=".",
  dockerfile="./deploy/dockerfiles/Dockerfile.client",
  target="runner-dev",
  live_update=[
    sync("./apps/client", "/evil-cards/apps/client")
  ]
)
