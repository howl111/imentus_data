import logo from './logo.svg';
import './App.css';
import idl from './stake_nft.json'
import * as anchor from '@project-serum/anchor'
async function StakeNFT()
{
  // Read the generated IDL.
//const idl = JSON.parse(require('fs').readFileSync('./target/idl/basic_0.json', 'utf8'));

// Address of the deployed program.
const programId = new anchor.web3.PublicKey('7VgHsEbVyjZaJCW6rUPU2UqrSt8J91f8mtgCCormi3ux');

const connection = new anchor.web3.Connection("https://api.devnet.solana.com");

try {
  const wallet = await window.solana.connect();
  wallet.publicKey.toString()
  // 26qv4GCcx98RihuK3c4T6ozB3J7L6VwCuFVc7Ta2A3Uo 


  // Configure the client to use the local cluster.
const provider = new anchor.Provider(connection, window.solana, {
  preflightCommitment: "recent",
});


// Generate the program client from IDL.
const program = new anchor.Program(idl, programId, provider);

console.log(program);
// Execute the RPC.
//await program.rpc.initialize();

const TOKEN_PROGRAM_ID = new anchor.web3.PublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
);

const mint = new anchor.web3.PublicKey("EhV7ppfmjXbSHPWSdwG7bsuTvsgArXsZav3ybvbyxaNC")
const tokenAccount = new anchor.web3.PublicKey("6ocL2pvM1ZvuAoV18Yvo1TKbdUfVcuk1btQSUyYFjsnm")
const [escrow,escrowBump] = await anchor.web3.PublicKey.findProgramAddress([mint.toBuffer()],programId);
const [eligible,eligibleBump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("state12"))],programId);
const signer = anchor.web3.Keypair.generate();

        const tx = new anchor.web3.Transaction().add(
            anchor.web3.SystemProgram.createAccount({
                fromPubkey: wallet.publicKey,
                lamports:anchor.web3.LAMPORTS_PER_SOL * 0.2,
                newAccountPubkey: signer.publicKey,
                programId:anchor.web3.SystemProgram.programId,
                space: 100
                
             }),
            program.instruction.initialize( escrowBump, eligibleBump,{
                accounts: {
                    wallet:signer.publicKey,
                    owner:wallet.publicKey,
                    escrowAccount:escrow,
                    eligible,
                    fromTokenAccount: tokenAccount,
                    mint,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY
                },
                signers: [signer]
            })
        )
    
        let { blockhash } = await connection.getRecentBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = wallet.publicKey;
        const {signature} = await window.solana.signAndSendTransaction(tx);
        await connection.confirmTransaction(signature);

} catch (err) {
  console.log(err)
  // { code: 4001, message: 'User rejected the request.' }
}


}

export function DSBApp() {
  StakeNFT();
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}