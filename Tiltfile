docker_compose("./deploy/compose/docker-compose.dev.yml")

dc_resource("server", labels=["application"])
dc_resource("load-balancer", labels=["application"])
dc_resource("client", labels=["application"])
dc_resource("keydb", labels=["database"])

sync_src = sync(".", "/evil-cards")
run_install_deps = run("pnpm install", "./pnpm-lock.yaml")

docker_build(
  ref="tilt/server",
  context=".",
  dockerfile="./deploy/dockerfiles/Dockerfile.server",
  target="runner-dev",
  live_update=[
    sync_src,
    run_install_deps,
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
    run_install_deps,
    restart_container()
  ]
)

docker_build(
  ref="tilt/client",
  context=".",
  dockerfile="./deploy/dockerfiles/Dockerfile.client",
  target="runner-dev",
  live_update=[
    sync_src,
    run_install_deps
  ]
)
