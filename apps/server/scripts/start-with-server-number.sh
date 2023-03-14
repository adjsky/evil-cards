#!/bin/bash

SERVER_NUMBER=$(dig -x "$(hostname -i)" +short | grep -o -E '[0-9]+')

SERVER_NUMBER=$SERVER_NUMBER npm start
