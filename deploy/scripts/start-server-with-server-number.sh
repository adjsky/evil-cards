#!/bin/bash

export SERVER_NUMBER=$(dig -x "$(hostname -i)" +short | grep -o -E '[0-9]+')

pnpm start:server
