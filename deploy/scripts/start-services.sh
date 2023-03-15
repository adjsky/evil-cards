#!/bin/bash

COMPOSE_PATH=$APP_PATH/$SOURCE_DIR/deploy/docker-compose.yml

$APP_PATH/$SOURCE_DIR/deploy/scripts/swap-envs.sh

docker-compose -f $COMPOSE_PATH up -d --remove-orphans

$APP_PATH/$SOURCE_DIR/deploy/scripts/cleanup.sh
