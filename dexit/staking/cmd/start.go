/*
Copyright © 2022 NAME HERE <EMAIL ADDRESS>

*/
package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

// startCmd represents the start command
var stakeCmd = &cobra.Command{
	Use:   "stake",
	Short: "this command allow validator to stake DXT",
	Long: "",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("Staking method called");
	},
}

func init() {
	rootCmd.AddCommand(stakeCmd)

	// Here you will define your flags and configuration settings.

	// Cobra supports Persistent Flags which will work for this command
	// and all subcommands, e.g.:
	// startCmd.PersistentFlags().String("foo", "", "A help for foo")

	// Cobra supports local flags which will only run when this command
	// is called directly, e.g.:
	// startCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}
