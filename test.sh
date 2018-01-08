#!/bin/bash -e
export RES_KEYS=$1
export RES_KEYS_UP=$(shipctl to_uppercase $RES_KEYS)
echo $RES_KEYS_UP

echo $(eval echo "$"$RES_KEYS_UP"_INTEGRATION_TEST")
echo $(shipctl get_integration_resource_field $RES_KEYS "TEST")

main() {
  #setup test comparison values
  . testParams.env
  npm install
#  npm run start-tests
}

#main
