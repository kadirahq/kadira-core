rm -rf ./build
node_modules/.bin/babel src --ignore __tests__ --out-dir ./build
