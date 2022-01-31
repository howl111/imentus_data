import {
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    TransactionInstruction,
    Connection, 
    Keypair,
    Transaction
  } from '@solana/web3.js';
  import base58 from 'bs58';
  import { serialize, BinaryReader, BinaryWriter } from 'borsh';
  import { AccountLayout, MintLayout, Token } from '@solana/spl-token';
  import BN from 'bn.js';
  import axios from 'axios';
  import * as anchor from '@project-serum/anchor';

  export const METADATA_PREFIX = 'metadata';
export const EDITION = 'edition';
export const CANDY_MACHINE = 'candy_machine';
  export const TOKEN_PROGRAM_ID = new PublicKey(
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  );
  export const CANDY_MACHINE_PROGRAM_ID = new PublicKey(
    'cndyAnrLdpjq1Ssp1z8xxDsB8dxe7u4HL5Nxi2K5WXZ',
  );
  
  export const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  );

  export const METADATA_PROGRAM_ID =
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'

  export const extendBorsh = () => {
    (BinaryReader.prototype).readPubkey = function () {
      const reader = this;
      const array = reader.readFixedArray(32);
      return new PublicKey(array);
    };
  
    (BinaryWriter.prototype).writePubkey = function (value) {
      const writer = this;
      writer.writeFixedArray(value.toBuffer());
    };
  
    (BinaryReader.prototype).readPubkeyAsString = function () {
      const reader = this;
      const array = reader.readFixedArray(32);
      return base58.encode(array);
    };
  
    (BinaryWriter.prototype).writePubkeyAsString = function (
      value,
    ) {
      const writer = this;
      writer.writeFixedArray(base58.decode(value));
    };
  };
  
  extendBorsh();

  export function createUninitializedMint(
    instructions,
    payer,
    amount,
    signers,
  ) {
    const account = Keypair.generate();
    instructions.push(
      SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: account.publicKey,
        lamports: amount,
        space: MintLayout.span,
        programId: TOKEN_PROGRAM_ID,
      }),
    );
  
    signers.push(account);
  
    return account.publicKey;
  }
  
  export function createAssociatedTokenAccountInstruction(
    instructions,
    associatedTokenAddress,
    payer,
    walletAddress,
    splTokenMintAddress,
  ) {
    const keys = [
      {
        pubkey: payer,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: associatedTokenAddress,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: walletAddress,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: splTokenMintAddress,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: TOKEN_PROGRAM_ID,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
    ];
    instructions.push(
      new TransactionInstruction({
        keys,
        programId: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
        data: Buffer.from([]),
      }),
    );
  }
  export function createAssociatedTokenAccount(
    associatedTokenAddress,
    payer,
    walletAddress,
    splTokenMintAddress,
  ) {
    const keys = [
      {
        pubkey: payer,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: associatedTokenAddress,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: walletAddress,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: splTokenMintAddress,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: TOKEN_PROGRAM_ID,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
    ];
    
    return new TransactionInstruction({
        keys,
        programId: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
        data: Buffer.from([]),
      })
    
  }
export function createMint(
    instructions,
    payer,
    mintRentExempt,
    decimals,
    owner,
    freezeAuthority,
    signers,
  ) {
    const account = createUninitializedMint(
      instructions,
      payer,
      mintRentExempt,
      signers,
    );
  
    instructions.push(
      Token.createInitMintInstruction(
        TOKEN_PROGRAM_ID,
        account,
        decimals,
        owner,
        freezeAuthority,
      ),
    );
  
    return account;
  }

  class CreateMetadataArgs {
    instruction = 0;
    data;
    isMutable;
  
    constructor(args) {
      this.data = args.data;
      this.isMutable = args.isMutable;
    }
  }

  class UpdateMetadataArgs {
    instruction = 1;
    data;
    // Not used by this app, just required for instruction
    updateAuthority;
    primarySaleHappened;
    constructor(args) {
      this.data = args.data ? args.data : null;
      this.updateAuthority = args.updateAuthority ? args.updateAuthority : null;
      this.primarySaleHappened = args.primarySaleHappened;
    }
  }
  
  export class MetadataKey {
    Uninitialized = 0;
    MetadataV1 = 4;
    EditionV1 = 1;
    MasterEditionV1 = 2;
    MasterEditionV2 = 6;
    EditionMarker = 7;
  }

  export async function getEdition(
    tokenMint,
  ) {
    
  
    return (
      await PublicKey.findProgramAddress(
        [
          Buffer.from(METADATA_PREFIX),
          new PublicKey(METADATA_PROGRAM_ID).toBuffer(),
          new PublicKey(tokenMint).toBuffer(),
          Buffer.from(EDITION),
        ],
        new PublicKey(METADATA_PROGRAM_ID),
      )
    )[0];
  }

  export class Metadata {
  
    constructor(args) {
      this.key = MetadataKey.MetadataV1;
      this.updateAuthority = args.updateAuthority;
      this.mint = args.mint;
      this.data = args.data;
      this.primarySaleHappened = args.primarySaleHappened;
      this.isMutable = args.isMutable;
      this.editionNonce = args.editionNonce ?? null;
    }
  
    async init() {
      const metadata = new PublicKey(METADATA_PROGRAM_ID);
      if (this.editionNonce !== null) {
        this.edition = (
          await PublicKey.createProgramAddress(
            [
              Buffer.from(METADATA_PREFIX),
              metadata.toBuffer(),
              new PublicKey(this.mint).toBuffer(),
              new Uint8Array([this.editionNonce || 0]),
            ],
            metadata,
          )
        ).toBase58();
      } else {
        this.edition = await getEdition(this.mint);
      }
      this.masterEdition = this.edition;
    }
  }

  export class Creator {
    address;
    verified;
    share;
  
    constructor(args) {
      this.address = args.address;
      this.verified = args.verified;
      this.share = args.share;
    }
  }

  export class Data {
    name;
    symbol;
    uri;
    sellerFeeBasisPoints;
    creators;
    constructor(args) {
      this.name = args.name;
      this.symbol = args.symbol;
      this.uri = args.uri;
      this.sellerFeeBasisPoints = args.sellerFeeBasisPoints;
      this.creators = args.creators;
    }
  }

  class CreateMasterEditionArgs {
    instruction = 10;
    maxSupply;
    constructor(args) {
      this.maxSupply = args.maxSupply;
    }
  }

  
  export const METADATA_SCHEMA = new Map([
    [
      CreateMetadataArgs,
      {
        kind: 'struct',
        fields: [
          ['instruction', 'u8'],
          ['data', Data],
          ['isMutable', 'u8'], // bool
        ],
      },
    ],
    [
        UpdateMetadataArgs,
        {
          kind: 'struct',
          fields: [
            ['instruction', 'u8'],
            ['data', { kind: 'option', type: Data }],
            ['updateAuthority', { kind: 'option', type: 'pubkeyAsString' }],
            ['primarySaleHappened', { kind: 'option', type: 'u8' }],
          ],
        },
    ],
    [
        CreateMasterEditionArgs,
        {
          kind: 'struct',
          fields: [
            ['instruction', 'u8'],
            ['maxSupply', { kind: 'option', type: 'u64' }],
          ],
        },
    ], 
    [
      Data,
      {
        kind: 'struct',
        fields: [
          ['name', 'string'],
          ['symbol', 'string'],
          ['uri', 'string'],
          ['sellerFeeBasisPoints', 'u16'],
          ['creators', { kind: 'option', type: [Creator] }],
        ],
      },
    ],
    [
      Creator,
      {
        kind: 'struct',
        fields: [
          ['address', 'pubkeyAsString'],
          ['verified', 'u8'],
          ['share', 'u8'],
        ],
      },
    ],
    [
      Metadata,
      {
        kind: 'struct',
        fields: [
          ['key', 'u8'],
          ['updateAuthority', 'pubkeyAsString'],
          ['mint', 'pubkeyAsString'],
          ['data', Data],
          ['primarySaleHappened', 'u8'], // bool
          ['isMutable', 'u8'], // bool
        ],
      },
    ],
  ])


  export async function createMetadata(
    data,
    updateAuthority,
    mintKey,
    mintAuthorityKey,
    instructions,
    payer,
  ) {

    
    const metadataAccount = (
      await PublicKey.findProgramAddress(
        [
          Buffer.from('metadata'),
          new PublicKey(METADATA_PROGRAM_ID).toBuffer(),
          new PublicKey(mintKey).toBuffer(),
        ],
        new PublicKey(METADATA_PROGRAM_ID),
      )
    )[0];
    console.log('Data', data);
    const value = new CreateMetadataArgs({ data, isMutable: true });
    console.log(value);
    const txnData = Buffer.from(serialize(METADATA_SCHEMA, value));
    
    const keys = [
      {
        pubkey: new PublicKey(metadataAccount),
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: new PublicKey(mintKey),
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: new PublicKey(mintAuthorityKey),
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: new PublicKey(payer),
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: new PublicKey(updateAuthority),
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
    ];
    instructions.push(
      new TransactionInstruction({
        keys,
        programId: new PublicKey(METADATA_PROGRAM_ID),
        data: txnData,
      }),
    );
  
    return metadataAccount;
  }

  export const sendTransactionWithRetry = async (
    connection,
    wallet,
    instructions,
    signers,
    commitment = 'singleGossip',
    includesFeePayer = false,
    block,
    beforeSend,
  ) => {
  
    let transaction = new Transaction();
    instructions.forEach(instruction => transaction.add(instruction));
    transaction.recentBlockhash = (
      block || (await connection.getRecentBlockhash(commitment))
    ).blockhash;
  
    if (includesFeePayer) {
      transaction.setSigners(...signers.map(s => s.publicKey));
    } else {
      transaction.setSigners(
        // fee payed by the wallet owner
        wallet.publicKey,
        ...signers.map(s => s.publicKey),
      );
    }
  
    if (signers.length > 0) {
      transaction.partialSign(...signers);
    }
    if (!includesFeePayer) {
      transaction = await wallet.signTransaction(transaction);
    }
  
    if (beforeSend) {
      beforeSend();
    }
  
    const { txid, slot } = await sendSignedTransaction({
      connection,
      signedTransaction: transaction,
    });
  
    return { txid, slot };
  };

  export const getUnixTs = () => {
    return new Date().getTime() / 1000;
  };
  
  const DEFAULT_TIMEOUT = 15000;

  export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

  export async function sendSignedTransaction({
    signedTransaction,
    connection,
    timeout = DEFAULT_TIMEOUT,
  }) {
    const rawTransaction = signedTransaction.serialize();
    const startTime = getUnixTs();
    let slot = 0;
    const txid = await connection.sendRawTransaction(
      rawTransaction,
      {
        skipPreflight: true,
      },
    );
  
    console.log('Started awaiting confirmation for', txid);
  
    let done = false;
    (async () => {
      while (!done && getUnixTs() - startTime < timeout) {
        connection.sendRawTransaction(rawTransaction, {
          skipPreflight: true,
        });
        await sleep(500);
      }
    })();
    try {
      const confirmation = await awaitTransactionSignatureConfirmation(
        txid,
        timeout,
        connection,
        'recent',
        true,
      );
  
      if (!confirmation)
        throw new Error('Timed out awaiting confirmation on transaction');
  
      if (confirmation.err) {
        console.error(confirmation.err);
        throw new Error('Transaction failed: Custom instruction error');
      }
  
      slot = confirmation?.slot || 0;
    } catch (err) {
      console.error('Timeout Error caught', err);
      if (err.timeout) {
        throw new Error('Timed out awaiting confirmation on transaction');
      }
      let simulateResult = null;
      try {
        simulateResult = (
          await simulateTransaction(connection, signedTransaction, 'single')
        ).value;
      } catch (e) {}
      if (simulateResult && simulateResult.err) {
        if (simulateResult.logs) {
          console.log(simulateResult.logs);
          for (let i = simulateResult.logs.length - 1; i >= 0; --i) {
            const line = simulateResult.logs[i];
            if (line.startsWith('Program log: ')) {
              throw new Error(
                'Transaction failed: ' + line.slice('Program log: '.length),
              );
            }
          }
        }
        throw new Error(JSON.stringify(simulateResult.err));
      }
      // throw new Error('Transaction failed');
    } finally {
      done = true;
    }
  
    console.log('Latency', txid, getUnixTs() - startTime);
    return { txid, slot };
  }

  async function simulateTransaction(
    connection,
    transaction,
    commitment,
  ) {
    // @ts-ignore
    transaction.recentBlockhash = await connection._recentBlockhash(
      // @ts-ignore
      connection._disableBlockhashCaching,
    );
  
    const signData = transaction.serializeMessage();
    // @ts-ignore
    const wireTransaction = transaction._serialize(signData);
    const encodedTransaction = wireTransaction.toString('base64');
    const config = { encoding: 'base64', commitment };
    const args = [encodedTransaction, config];
  
    // @ts-ignore
    const res = await connection._rpcRequest('simulateTransaction', args);
    if (res.error) {
      throw new Error('failed to simulate transaction: ' + res.error.message);
    }
    return res.result;
  }
  

  async function awaitTransactionSignatureConfirmation(
    txid,
    timeout,
    connection,
    commitment = 'recent',
    queryStatus = false,
  ) {
    let done = false;
    let status = {
      slot: 0,
      confirmations: 0,
      err: null,
    };
    let subId = 0;
    status = await new Promise(async (resolve, reject) => {
      setTimeout(() => {
        if (done) {
          return;
        }
        done = true;
        console.log('Rejecting for timeout...');
        reject({ timeout: true });
      }, timeout);
      try {
        subId = connection.onSignature(
          txid,
          (result, context) => {
            done = true;
            status = {
              err: result.err,
              slot: context.slot,
              confirmations: 0,
            };
            if (result.err) {
              console.log('Rejected via websocket', result.err);
              reject(status);
            } else {
              console.log('Resolved via websocket', result);
              resolve(status);
            }
          },
          commitment,
        );
      } catch (e) {
        done = true;
        console.error('WS error in setup', txid, e);
      }
      while (!done && queryStatus) {
        // eslint-disable-next-line no-loop-func
        (async () => {
          try {
            const signatureStatuses = await connection.getSignatureStatuses([
              txid,
            ]);
            status = signatureStatuses && signatureStatuses.value[0];
            if (!done) {
              if (!status) {
                console.log('REST null result for', txid, status);
              } else if (status.err) {
                console.log('REST error for', txid, status);
                done = true;
                reject(status.err);
              } else if (!status.confirmations) {
                console.log('REST no confirmations for', txid, status);
              } else {
                console.log('REST confirmation for', txid, status);
                done = true;
                resolve(status);
              }
            }
          } catch (e) {
            if (!done) {
              console.log('REST connection error: txid', txid, e);
            }
          }
        })();
        await sleep(2000);
      }
    });
  
    //@ts-ignore
    if (connection._signatureSubscriptions[subId])
      connection.removeSignatureListener(subId);
    done = true;
    console.log('Returning status', status);
    return status;
  }

  const uploadToArweave = async (data) => {
    const resp = await fetch(
      'https://us-central1-principal-lane-200702.cloudfunctions.net/uploadFile4',
      {
        method: 'POST',
        // @ts-ignore
        body: data,
      },
    );
  
    if (!resp.ok) {
      return Promise.reject(
        new Error(
          'Unable to upload the artwork to Arweave. Please wait and then try again.',
        ),
      );
    }
  
    const result = await resp.json();
  
    if (result.error) {
      return Promise.reject(new Error(result.error));
    }
  
    return result;
  };

  export async function updateMetadata(
    data,
    newUpdateAuthority,
    primarySaleHappened,
    mintKey,
    updateAuthority,
    instructions,
    metadataAccount,
  ) {
    
  
    metadataAccount =
      metadataAccount ||
      (
        await PublicKey.findProgramAddress(
          [
            Buffer.from('metadata'),
            METADATA_PROGRAM_ID.toBuffer(),
            new PublicKey(mintKey).toBuffer(),
          ],
          METADATA_PROGRAM_ID,
        )
      )[0];
  
    const value = new UpdateMetadataArgs({
      data,
      updateAuthority: !newUpdateAuthority ? undefined : newUpdateAuthority,
      primarySaleHappened:
        primarySaleHappened === null || primarySaleHappened === undefined
          ? null
          : primarySaleHappened,
    });
    const txnData = Buffer.from(serialize(METADATA_SCHEMA, value));
    const keys = [
      {
        pubkey: new PublicKey(metadataAccount),
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: new PublicKey(updateAuthority),
        isSigner: true,
        isWritable: false,
      },
    ];
    instructions.push(
      new TransactionInstruction({
        keys,
        programId: METADATA_PROGRAM_ID,
        data: txnData,
      }),
    );
  
    return metadataAccount;
  }

  export async function createMasterEdition(
    maxSupply,
    mintKey,
    updateAuthorityKey,
    mintAuthorityKey,
    payer,
    instructions,
  ) {
    
  
    const metadataAccount = (
      await PublicKey.findProgramAddress(
        [
          Buffer.from(METADATA_PREFIX),
          new PublicKey(METADATA_PROGRAM_ID).toBuffer(),
          new PublicKey(mintKey).toBuffer(),
        ],
        new PublicKey(METADATA_PROGRAM_ID),
      )
    )[0];
  
    const editionAccount = (
      await PublicKey.findProgramAddress(
        [
          Buffer.from(METADATA_PREFIX),
          new PublicKey(METADATA_PROGRAM_ID).toBuffer(),
          new PublicKey(mintKey).toBuffer(),
          Buffer.from(EDITION),
        ],
        new PublicKey(METADATA_PROGRAM_ID),
      )
    )[0];
    console.log("maz",maxSupply);
    const value = new CreateMasterEditionArgs({ maxSupply: maxSupply || null });
    const data = Buffer.from(serialize(METADATA_SCHEMA, value));
  
    const keys = [
      {
        pubkey: new PublicKey(editionAccount),
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: new PublicKey(mintKey),
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: new PublicKey(updateAuthorityKey),
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: new PublicKey(mintAuthorityKey),
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: new PublicKey(payer),
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: new PublicKey(metadataAccount),
        isSigner: false,
        isWritable: false,
      },
  
      {
        pubkey: TOKEN_PROGRAM_ID,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
    ];
  
    instructions.push(
      new TransactionInstruction({
        keys,
        programId: METADATA_PROGRAM_ID,
        data,
      }),
    );
  }
  
  
export async function mintNFT(metadata,cidUri,wallet) {
    let instructions = [];
    let signers = [];
    const metadataContent = {
        name: metadata.name,
        symbol: metadata.symbol,
        description: metadata.description,
        seller_fee_basis_points: metadata.sellerFeeBasisPoints,
        image: metadata.image,
        animation_url: metadata.animation_url,
        attributes: metadata.attributes,
        external_url: metadata.external_url,
        properties: {
          ...metadata.properties,
          creators: metadata.creators?.map(creator => {
            return {
              address: creator.address,
              share: creator.share,
            };
          }),
        },
      };

      const connection = new Connection("https://api.devnet.solana.com")

      const mintRent = await connection.getMinimumBalanceForRentExemption(
        MintLayout.span,
      );

      const payerPublicKey = wallet.publicKey.toBase58();

      const mintKey = createMint(
        instructions,
        wallet.publicKey,
        mintRent,
        0,
        // Some weird bug with phantom where it's public key doesnt mesh with data encode wellff
        new PublicKey(payerPublicKey),
        new PublicKey(payerPublicKey),
        signers,
      ).toBase58();


      const recipientKey = (
        await PublicKey.findProgramAddress(
          [
            wallet.publicKey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            new PublicKey(mintKey).toBuffer(),
          ],
          SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
        )
      )[0];
    
      createAssociatedTokenAccountInstruction(
        instructions,
        new PublicKey(recipientKey),
        wallet.publicKey,
        wallet.publicKey,
        new PublicKey(mintKey),
      );

      const metadataAccount = await createMetadata(
        new Data({
          symbol: metadata.symbol,
          name: metadata.name,
          uri: cidUri, // size of url for arweave
          sellerFeeBasisPoints: metadata.seller_fee_basis_points,
          creators: [new Creator({
            address: metadata.properties.creators[0].address,
            verified: metadata.properties.creators[0].verified,
            share: metadata.properties.creators[0].share
          })]
        }),
        payerPublicKey,
        mintKey,
        payerPublicKey,
        instructions,
        wallet.publicKey.toBase58(),
      );

      

    //   let updateInstructions = [];
    //   let updateSigners = [];
    //   await updateMetadata(
    //     new Data({
    //       name: metadata.name,
    //       symbol: metadata.symbol,
    //       uri: "http://localhost:5000/nfts"+metadata.name,
    //       creators: metadata.properties.creators,
    //       sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
    //     }),
    //     undefined,
    //     undefined,
    //     mintKey,
    //     payerPublicKey,
    //     updateInstructions,
    //     metadataAccount,
    //   );

      instructions.push(
        Token.createMintToInstruction(
          TOKEN_PROGRAM_ID,
          new PublicKey(mintKey),
          new PublicKey(recipientKey),
          new PublicKey(payerPublicKey),
          [],
          1,
        ),
      );

      let maxSupply = undefined;
      await createMasterEdition(
        maxSupply !== undefined ? new BN(maxSupply) : undefined,
        mintKey,
        payerPublicKey,
        payerPublicKey,
        payerPublicKey,
        instructions,
      );

      const { txid } = await sendTransactionWithRetry(
        connection,
        wallet,
        instructions,
        signers,
        'single',
      );

      try {
        await connection.confirmTransaction(txid, 'max');
      } catch {
        // ignore
      }
      
      await connection.getParsedConfirmedTransaction(txid, 'confirmed');
    
    }

    const NEW_PROGRAM = new PublicKey("DYTwTTp4vGgQsyrLpMRiiqXr5WzEGfbYtxepGsoMo6BK")


    export async function callProgram() {
    
      
      const programJson = 
  {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getProgramAccounts",
    "params": [
      "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      {
        "encoding": "jsonParsed",
        "filters": [
          {
            "dataSize": 165
          },
          {
            "memcmp": {
              "offset": 32,
              "bytes": window.solana.publicKey.toString()
            }
          }
        ]
      }
    ]
  }


    const result = await axios.post("http://api.devnet.solana.com",programJson);

    const tokens = result.data["result"]
    console.log(tokens);
    console.log(window.solana.publicKey)
    const instruction = new TransactionInstruction({
        keys: [
          {pubkey: new PublicKey(window.solana.publicKey), isSigner: true, isWritable: false},
          {pubkey: new PublicKey(tokens[0]["account"]["data"]["parsed"]["info"]["mint"]), isSigner: false, isWritable: false}
        ],
        programId: NEW_PROGRAM,
        data: Buffer.alloc(0), 
      });


      const { txid } = await sendTransactionWithRetry(
        new Connection("http://api.devnet.solana.com"),
        window.solana,
        [instruction],
        [],
        'single',
      );


    }

    const getTokenWallet = async (
      wallet,
      mint
    ) => {
      return (
        await anchor.web3.PublicKey.findProgramAddress(
          [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
          SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
        )
      )[0];
    };

    const getMasterEdition = async (
      mint
    ) => {
      return (
        await anchor.web3.PublicKey.findProgramAddress(
          [
            Buffer.from("metadata"),
            new PublicKey(METADATA_PROGRAM_ID).toBuffer(),
            mint.toBuffer(),
            Buffer.from("edition"),
          ],
          new PublicKey(METADATA_PROGRAM_ID)
        )
      )[0];
    };
    
    const getMetadata = async (
      mint
    ) =>{
      return (
        await anchor.web3.PublicKey.findProgramAddress(
          [
            Buffer.from("metadata"),
            new PublicKey(METADATA_PROGRAM_ID).toBuffer(),
            mint.toBuffer(),
          ],
          new PublicKey(METADATA_PROGRAM_ID)
        )
      )[0];
    };

    export const mintOneToken = async (
      metadataContent,
      candyMachine,
      config,
      payer,
      treasury,
    ) =>{
      
      const mint = anchor.web3.Keypair.generate();
      const token = await getTokenWallet(payer, mint.publicKey);
      const { connection, program } = candyMachine;
      const metadata = await getMetadata(mint.publicKey);
      const masterEdition = await getMasterEdition(mint.publicKey);
      const rent = await connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      );
      const METADATA_PROGRAM_PUBLIC_KEY = new PublicKey(METADATA_PROGRAM_ID);
      const res = await program.rpc.mintNft({
        accounts: {
          config,
          candyMachine: candyMachine.id,
          payer: payer,
          wallet: treasury,
          mint: mint.publicKey,
          metadata,
          masterEdition,
          mintAuthority: payer,
          updateAuthority: payer,
          tokenMetadataProgram: METADATA_PROGRAM_PUBLIC_KEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        },
        signers: [mint],
        instructions: [
          anchor.web3.SystemProgram.createAccount({
            fromPubkey: payer,
            newAccountPubkey: mint.publicKey,
            space: MintLayout.span,
            lamports: rent,
            programId: TOKEN_PROGRAM_ID,
          }),
          Token.createInitMintInstruction(
            TOKEN_PROGRAM_ID,
            mint.publicKey,
            0,
            payer,
            payer
          ),
          createAssociatedTokenAccount(
            token,
            payer,
            payer,
            mint.publicKey
          ),
          Token.createMintToInstruction(
            TOKEN_PROGRAM_ID,
            mint.publicKey,
            token,
            payer,
            [],
            1
          )
        ],
      });
      const confirmation = await connection.confirmTransaction(res);
      console.log(confirmation);
      if(confirmation.value.err == null) {
        axios.post(process.env.REACT_APP_API_ENDPOINT+"/mint/"+metadataContent.collection.name.replace(/ /g,""),{pubkey:mint.publicKey.toString()})
        alert("Successfully minted");
      }
    }
    