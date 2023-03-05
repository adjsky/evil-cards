#!/bin/bash

COMPOSE_PATH=$APP_PATH/source/deploy/docker-compose.yml

$APP_PATH/source/deploy/scripts/swap-envs.sh

docker-compose -f $COMPOSE_PATH pull server
docker-compose -f $COMPOSE_PATH up -d --no-deps server

$APP_PATH/source/deploy/scripts/cleanup.sh
