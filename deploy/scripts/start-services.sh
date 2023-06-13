#!/bin/bash

COMPOSE_PATH=$APP_PATH/$SOURCE_DIR/deploy/compose/docker-compose.$DEPLOY_ENV.yml

$APP_PATH/$SOURCE_DIR/deploy/scripts/swap-envs.sh

docker compose -f $COMPOSE_PATH pull
docker compose -f $COMPOSE_PATH up --wait --remove-orphans --no-recreate

$APP_PATH/$SOURCE_DIR/deploy/scripts/cleanup.sh
