#!/bin/bash

SERVICES=("plausible" "postgres" "load-balancer" "server")

for SERVICE in "${SERVICES[@]}"; do
  SOURCE=$APP_PATH/$SOURCE_DIR/deploy/envs/$SERVICE.env
  FILLED=$APP_PATH/envs/$SERVICE.env

  rm $SOURCE
  ln -s $FILLED $SOURCE
done
