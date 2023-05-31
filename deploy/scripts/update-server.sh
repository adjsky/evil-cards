#!/bin/bash

COMPOSE_PATH=$APP_PATH/$SOURCE_DIR/deploy/compose/docker-compose.$DEPLOY_ENV.yml

$APP_PATH/$SOURCE_DIR/deploy/scripts/swap-envs.sh

if [[ $DEPLOY_ENV = "prod" ]]; then
  SECONDS_TO_REMOVE_CONTAINER=3600
  CURRENT_RUNNING_SERVERS=()

  for CONTAINER in $(docker compose -f $COMPOSE_PATH ps server | tail -n +3 | awk '{ print $1 }'); do
    CURRENT_RUNNING_SERVERS+=($CONTAINER)

    (
      nohup sh -c "sleep $SECONDS_TO_REMOVE_CONTAINER && docker stop $CONTAINER && docker rm $CONTAINER" >/dev/null 2>&1
    ) &

    echo "$CONTAINER will be stopped and removed after $SECONDS_TO_REMOVE_CONTAINER seconds"
  done

  SCALE=$(($SERVERS_TO_START * 2 + ${#CURRENT_RUNNING_SERVERS[@]} - $SERVERS_TO_START))

  docker compose -f $COMPOSE_PATH pull server
  docker compose -f $COMPOSE_PATH up -d --no-deps --no-recreate --scale server=$SCALE server

  AVAILABLE_SERVERS=()

  for CONTAINER in $(docker compose -f $COMPOSE_PATH ps server | tail -n +3 | awk '{ print $1 }'); do
    if [[ ! " ${CURRENT_RUNNING_SERVERS[@]} " =~ " $CONTAINER " ]]; then
      AVAILABLE_SERVERS+=($(echo $CONTAINER | grep -o -E '[0-9]+'))
    fi
  done

  docker compose -f $COMPOSE_PATH exec -T keydb keydb-cli -n 0 SET servers "${AVAILABLE_SERVERS[*]}"

  echo "Updated servers in keydb, ids: ${AVAILABLE_SERVERS[@]}"
else
  docker compose -f $COMPOSE_PATH pull server
  docker compose -f $COMPOSE_PATH up -d --no-deps server
fi

$APP_PATH/$SOURCE_DIR/deploy/scripts/cleanup.sh
