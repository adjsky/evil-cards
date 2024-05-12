docker_compose("./deploy/compose/docker-compose.dev.yml")

# ------------------------------------ apps ------------------------------------

dc_resource("server", labels=["application"])
dc_resource("load-balancer", labels=["application"])
dc_resource("client", labels=["application"])

sync_src = sync(".", "/evil-cards")
install_deps = run("pnpm --frozen-lockfile install", trigger=["./pnpm-lock.yaml"])

docker_build(
    ref="tilt/server",
    context=".",
    dockerfile="./deploy/dockerfiles/Dockerfile.server",
    target="runner-dev",
    live_update=[
        sync_src,
        install_deps
    ]
)

docker_build(
    ref="tilt/load-balancer",
    context=".",
    dockerfile="./deploy/dockerfiles/Dockerfile.load-balancer",
    target="runner-dev",
    live_update=[
        sync_src,
        install_deps
    ]
)

docker_build(
    ref="tilt/client",
    context=".",
    dockerfile="./deploy/dockerfiles/Dockerfile.client",
    target="runner-dev",
    live_update=[
        sync_src,
        install_deps
    ]
)

# ------------------------------------- db -------------------------------------

dc_resource("keydb", labels="database")

# ------------------------------------ test ------------------------------------

dc_resource("pwserver", labels=["test"])

docker_build(
    ref="tilt/pwserver",
    context=".",
    dockerfile="./deploy/dockerfiles/Dockerfile.pwserver",
)

local_resource(
    "e2e",
    cmd="HOST=127.0.0.1:3000 PW_TEST_CONNECT_WS_ENDPOINT=ws://127.0.0.1:6969 pnpm test:e2e",
    labels=["test"],
    allow_parallel=True,
    trigger_mode=TRIGGER_MODE_MANUAL,
    auto_init=False
)

local_resource(
    "tsc",
    cmd="pnpm ts-check",
    labels=["test"],
    allow_parallel=True,
    trigger_mode=TRIGGER_MODE_MANUAL,
    auto_init=False
)
