#!/bin/sh
solana airdrop 1 -u devnet winit.json
alias candymachine="ts-node metaplex/js/packages/cli/src/candy-machine-v2-cli.ts"
candymachine upload -e devnet -k winit.json -cp candymachine.json -c $1 ./static/$1