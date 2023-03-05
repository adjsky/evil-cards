#!/bin/bash

COMPOSE_PATH=$APP_PATH/$SOURCE_DIR/deploy/docker-compose.yml

$APP_PATH/scripts/swap-envs.sh

docker-compose -f $COMPOSE_PATH pull
docker-compose -f $COMPOSE_PATH up -d

$APP_PATH/scripts/cleanup.sh
