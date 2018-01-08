#!/bin/bash -e
export RES_KEYS=$1
echo $(shipctl get_integration_resource_field $RES_KEYS "TEST")

main() {
  #setup test comparison values
  . testParams.env
  npm install
#  npm run start-tests
}

#main
