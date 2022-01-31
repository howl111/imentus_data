#!/bin/bash
echo "My Devnet scheme begins with Serum dex..."

anchor build &&\
anchor deploy &&\
ts-node devnet-migrate.ts &&\
anchor test
