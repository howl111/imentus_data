/*
Copyright © 2022 NAME HERE <EMAIL ADDRESS>

*/
package cmd
import (
	"context"
	"fmt"
	"io/ioutil"
	"log"
	"math/big"

	"github.com/spf13/cobra"
	"github.com/ethereum/go-ethereum/accounts/keystore"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
)

var (
	sender 	string
	pk 		string
	to  	string
	amt 	int64
)

var infuraURL = "https://testnet.dexit.network"

var sendtransaction = &cobra.Command{
	Use:   "sendtransaction",
	Short: "send a transaction",
	Long: "",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("transaction method is called");
		transaction();
	},
}

func init() {
	rootCmd.AddCommand(sendtransaction)
	sendtransactionFlags();
}

func sendtransactionFlags(){
	sendtransaction.Flags().StringVarP(&sender,"sender","", "", "the chain id of dexit chain.");
	sendtransaction.MarkFlagRequired("sender");

	sendtransaction.Flags().StringVarP(&pk,"pk","", "", "the chain id of dexit chain.");
	sendtransaction.MarkFlagRequired("pk");

	sendtransaction.Flags().StringVarP(&to,"to","", "", "the chain id of dexit chain.");
	sendtransaction.MarkFlagRequired("to");

	sendtransaction.Flags().Int64Var(&amt,"amt",0, "the chain id of dexit chain.");
	sendtransaction.MarkFlagRequired("amt");
}
func transaction() {
	// ks := keystore.NewKeyStore("./wallet", keystore.StandardScryptN, keystore.StandardScryptP)
	// _, err := ks.NewAccount("password")
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// _, err = ks.NewAccount("password")
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// "1f7ecea2fa83cc4a7de969f11d16a40edf9023d7"
	// "1e41ca1ccfc06597525c966a986b35a09e22358d"

	client, err := ethclient.DialContext(context.Background(),infuraURL);
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()
	a1 := common.HexToAddress(sender)
	a2 := common.HexToAddress(to)

	b1, err := client.BalanceAt(context.Background(), a1, nil)
	if err != nil {
		log.Fatal(err)
	}

	b2, err := client.BalanceAt(context.Background(), a2, nil)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Balance 1:", b1)
	fmt.Println("Balance 2:", b2)
	nonce, err := client.PendingNonceAt(context.Background(), a1)
	if err != nil {
		log.Fatal(err)
	}
	// 1 ether = 1000000000000000000 wei
	amount := big.NewInt(amt)
	gasPrice, err := client.SuggestGasPrice(context.Background())
	if err != nil {
		log.Fatal(err)
	}
	tx := types.NewTransaction(nonce, a2, amount, 21000, gasPrice, nil)
	chainID, err := client.NetworkID(context.Background())
	if err != nil {
		log.Fatal(err)
	}

	b, err := ioutil.ReadFile(pk)
	if err != nil {
		log.Fatal(err)
	}

	key, err := keystore.DecryptKey(b, "1234")
	if err != nil {
		log.Fatal(err)
	}

	tx, err = types.SignTx(tx, types.NewEIP155Signer(chainID), key.PrivateKey)
	if err != nil {
		log.Fatal(err)
	}

	err = client.SendTransaction(context.Background(), tx)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("tx sent: %s", tx.Hash().Hex())
}