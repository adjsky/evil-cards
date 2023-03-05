#!/bin/bash

COMPOSE_PATH=$APP_PATH/source/deploy/docker-compose.yml

$APP_PATH/source/deploy/scripts/swap-envs.sh

docker-compose -f $COMPOSE_PATH pull load-balancer
docker-compose -f $COMPOSE_PATH up -d --no-deps load-balancer

$APP_PATH/source/deploy/scripts/cleanup.sh
