import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Demo } from '../target/types/demo';
const { SystemProgram } = anchor.web3;
const assert = require("assert");

describe('demo', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const providerWalletPublicKey = provider.wallet.publicKey


  const program = anchor.workspace.Demo as Program<Demo>;

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });

  it('Deposit completed', async () => {
  const myAccount = anchor.web3.Keypair.generate();
  const program = anchor.workspace.Demo;
  // const tx = await program.rpc.Deposit({}
  // )
  console.log("transaction completed")
  })
});
