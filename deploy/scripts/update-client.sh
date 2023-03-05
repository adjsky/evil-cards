#!/bin/bash

COMPOSE_PATH=$APP_PATH/source/deploy/docker-compose.yml

$APP_PATH/source/deploy/scripts/swap-envs.sh

docker-compose -f $COMPOSE_PATH pull client
docker-compose -f $COMPOSE_PATH up -d --no-deps client

$APP_PATH/source/scripts/cleanup.sh
