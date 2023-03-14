#!/bin/bash

COMPOSE_PATH=$APP_PATH/$SOURCE_DIR/deploy/docker-compose.yml

$APP_PATH/$SOURCE_DIR/deploy/scripts/swap-envs.sh

docker-compose -f $COMPOSE_PATH pull client
docker-compose -f $COMPOSE_PATH up -d --no-deps client

$APP_PATH/$SOURCE_DIR/scripts/cleanup.sh
