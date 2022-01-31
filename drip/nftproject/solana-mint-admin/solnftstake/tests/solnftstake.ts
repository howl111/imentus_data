import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Solnftstake } from '../target/types/solnftstake';

describe('solnftstake', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Solnftstake as Program<Solnftstake>;

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
