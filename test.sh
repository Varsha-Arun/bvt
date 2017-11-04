#!/bin/bash -e


main() {
  #setup test comparison values
  . testCompareParams.env
  npm install
  npm run start-tests
}

main
