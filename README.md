using yarn instead of npm

make sure to get the .env file from Jeff or I (mrlucciola) first
# installation
1. `git clone git@github.com:mrlucciola/aave-liquidator.git`
2. in terminal, navigate to the dir where this repo is saved (`mkdir aave-liquidation-engine`)
3. run `yarn` to install dependencies

to run a script, go to the "scripts" section of `./package.json` and enter command  `yarn <name of command>` to run the script, feel free to add your own
- This app is written in ES6+ JS and therefore needs to use ESM, loaded before any of the scripts run

Currently refactoring the dbHealthUpdateListener call