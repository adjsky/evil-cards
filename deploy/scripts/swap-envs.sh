#!/bin/bash

for FILLED_ENV_FILE in $APP_PATH/envs/$DEPLOY_ENV/*.env; do
    SOURCE_ENV_FILE=$APP_PATH/$SOURCE_DIR/deploy/envs/$SERVICE.env

    rm $SOURCE_ENV_FILE
    ln -s $FILLED_ENV_FILE $SOURCE_ENV_FILE
done
