docker_compose("./deploy/compose/docker-compose.dev.yml")

dc_resource("server", labels=["application"])
dc_resource("load-balancer", labels=["application"])
dc_resource("client", labels=["application"])
dc_resource("keydb", labels=["database"])

sync_src = sync(".", "/evil-cards")

docker_build(
  ref="tilt/server",
  context=".",
  dockerfile="./deploy/dockerfiles/Dockerfile.server",
  target="runner-dev",
  live_update=[
    sync_src,
    restart_container()
  ]
)

docker_build(
  ref="tilt/load-balancer",
  context=".",
  dockerfile="./deploy/dockerfiles/Dockerfile.load-balancer",
  target="runner-dev",
  live_update=[
    sync_src,
    restart_container()
  ]
)

docker_build(
  ref="tilt/client",
  context=".",
  dockerfile="./deploy/dockerfiles/Dockerfile.client",
  target="runner-dev",
  live_update=[
    sync_src
  ]
)

local_resource(
  "client-test",
  serve_cmd="pnpm test:client",
  labels=["test"],
  allow_parallel=True
)

local_resource(
  "server-test",
  serve_cmd="pnpm test:server",
  labels=["test"],
  allow_parallel=True
)
