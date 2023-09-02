#!/bin/bash

COMPOSE_PATH=$APP_PATH/$SOURCE_DIR/deploy/compose/docker-compose.$DEPLOY_ENV.yml

$APP_PATH/$SOURCE_DIR/deploy/scripts/swap-envs.sh

SECONDS_TO_REMOVE_CONTAINER=3600
CURRENT_RUNNING_SERVERS=()

for CONTAINER in $(docker compose -f $COMPOSE_PATH ps server | tail -n +2 | awk '{ print $1 }'); do
  CURRENT_RUNNING_SERVERS+=($CONTAINER)

  (
    nohup sh -c "sleep $SECONDS_TO_REMOVE_CONTAINER && docker stop $CONTAINER && docker rm $CONTAINER" >/dev/null 2>&1
  ) &

  echo "$CONTAINER will be stopped and removed after $SECONDS_TO_REMOVE_CONTAINER seconds"
done

SCALE=$(($SERVERS_TO_START * 2 + ${#CURRENT_RUNNING_SERVERS[@]} - $SERVERS_TO_START))

docker compose -f $COMPOSE_PATH pull server
docker compose -f $COMPOSE_PATH up -d --no-deps --no-recreate --scale server=$SCALE server

docker compose -f $COMPOSE_PATH exec load-balancer wget -qO- --post-data='{ "version": "'"$VERSION"'" }' --header="Authorization: Bearer $UPDATE_TOKEN" --header="Content-Type: application/json" http://127.0.0.1:1337

$APP_PATH/$SOURCE_DIR/deploy/scripts/cleanup.sh
