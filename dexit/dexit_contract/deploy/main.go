package main

import (
	"context"
	"fmt"
	"io/ioutil"
	"log"
	"math/big"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/accounts/keystore"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	staking "github.com/ashumehta26/dexit-blockchain-network/gen"
)

func main() {
	b, err := ioutil.ReadFile("/home/imentus/iMentus-Projects/dexit/dexit_contract/wallet/UTC--2022-01-27T07-28-32.586874409Z--f6d65144a4ff156e0f08c990f1b98b9dbea0bf43")
	if err != nil {
		log.Fatal(err)
	}

	key, err := keystore.DecryptKey(b, "1234")
	if err != nil {
		log.Fatal(err)
	}

	client, err := ethclient.Dial("https://testnet.dexit.network")
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()

	add := crypto.PubkeyToAddress(key.PrivateKey.PublicKey)

	nonce, err := client.PendingNonceAt(context.Background(), add)
	if err != nil {
		log.Fatal(err)
	}

	gasPrice, err := client.SuggestGasPrice(context.Background())
	if err != nil {
		log.Fatal(err)
	}

	chainID, err := client.NetworkID(context.Background())
	if err != nil {
		log.Fatal(err)
	}

	auth, err := bind.NewKeyedTransactorWithChainID(key.PrivateKey, chainID)
	if err != nil {
		log.Fatal(err)
	}
	auth.GasPrice = gasPrice
	auth.GasLimit = uint64(3000000)
	auth.Nonce = big.NewInt(int64(nonce))

	a, tx, _, err := staking.DeployStaking(auth, client)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("-----------------------------------")
	fmt.Println(a.Hex())
	fmt.Println(tx.Hash().Hex())
	fmt.Println("-----------------------------------")
}