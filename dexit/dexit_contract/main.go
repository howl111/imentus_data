package main

import (
	"context"
	"fmt"
	"io/ioutil"
	"log"
	"math/big"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/accounts/keystore"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	CD "github.com/ashumehta26/dexit-blockchain-network/gen"
)
const (
	// HashLength is the expected length of the hash
	HashLength = 32
	// AddressLength is the expected length of the address
	AddressLength = 20
)
type Address [AddressLength]byte;
var add = "0xd54cf9C85ccE75DD4fFd5d1f1877a24F745e1f39";
var data = []byte(add);
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

	chainID, err := client.NetworkID(context.Background())
	if err != nil {
		log.Fatal(err)
	}

	gasPrice, err := client.SuggestGasPrice(context.Background())
	if err != nil {
		log.Fatal(err)
	}

	cAdd := common.HexToAddress("0x5FE33062f0B0184DDe0B1Be7CC3B283DE39b3647")
	t, err := CD.NewStaking(cAdd, client)
	if err != nil {
		log.Fatal(err)
	}

	tx, err := bind.NewKeyedTransactorWithChainID(key.PrivateKey, chainID)
	if err != nil {
		log.Fatal(err)
	}
	tx.GasLimit = 3000000
	tx.GasPrice = gasPrice

	// tra, err := t.Add(tx, "First Task")
	// if err != nil {
	// 	log.Fatal(err)
	// }

	// fmt.Println(tra.Hash())

	add := crypto.PubkeyToAddress(key.PrivateKey.PublicKey)
	tasks, err := t.Get(&bind.CallOpts{
		From: add,
	}, add)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(tasks)
	amount := big.NewInt(88)
	tra, err := t.Set(tx, amount)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Toggle tx", tra)

	// tra, err := t.Remove(tx, big.NewInt(0))
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// fmt.Println("Toggle tx", tra.Hash())

}