#!/usr/bin/env bash

set -e
set -x

tsc -p server
tsc -p client
tsc -p server/simple-package

cp -f server/simple-package/package.json dist/simple-package/package.json
