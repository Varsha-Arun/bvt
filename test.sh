#!/bin/bash -e


main() {
  #setup test comparison values
  . testParams.env
  npm install
  npm run start-tests
}

main
