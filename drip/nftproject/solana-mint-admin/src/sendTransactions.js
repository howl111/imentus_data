import {
    Keypair,
    Commitment,
    Connection,
    RpcResponseAndContext,
    SignatureStatus,
    SimulatedTransactionResponse,
    Transaction,
    TransactionInstruction,
    TransactionSignature,
    Blockhash,
    FeeCalculator,
  } from '@solana/web3.js';
  
  import {
    WalletNotConnectedError,
  } from '@solana/wallet-adapter-base';
import axios from 'axios';
        
  export class SequenceType {
    Sequential = 0
    Parallel = 1
    StopOnFailure = 2
  }

  
  export const getErrorForTransaction = async (
    connection,
    txid,
  ) => {
    // wait for all confirmation before geting transaction
    await connection.confirmTransaction(txid, 'max');
  
    const tx = await connection.getParsedConfirmedTransaction(txid);
  
    const errors = [];
    if (tx?.meta && tx.meta.logMessages) {
      tx.meta.logMessages.forEach(log => {
        const regex = /Error: (.*)/gm;
        let m;
        while ((m = regex.exec(log)) !== null) {
          // This is necessary to avoid infinite loops with zero-width matches
          if (m.index === regex.lastIndex) {
            regex.lastIndex++;
          }
  
          if (m.length > 1) {
            errors.push(m[1]);
          }
        }
      });
    }
  
    return errors;
  };
  
  
  export const sendTransactions = async (
    connection,
    wallet,
    instructionSet,
    signersSet,
    sequenceType,
    commitment,
    block,
  ) => {
    if (!wallet.publicKey) throw new WalletNotConnectedError();
  
    const unsignedTxns = [];
  
    if (!block) {
      block = await connection.getRecentBlockhash(commitment);
    }
  
    for (let i = 0; i < instructionSet.length; i++) {
      const instructions = instructionSet[i];
      const signers = signersSet[i];
  
      if (instructions.length === 0) {
        continue;
      }
  
      let transaction = new Transaction();
      instructions.forEach(instruction => transaction.add(instruction));
      transaction.recentBlockhash = block.blockhash;
      transaction.setSigners(
        // fee payed by the wallet owner
        wallet.publicKey,
        ...signers.map(s => s.publicKey),
      );
  
      if (signers.length > 0) {
        transaction.partialSign(...signers);
      }
  
      unsignedTxns.push(transaction);
    }
  
    const signedTxns = await wallet.signAllTransactions(unsignedTxns);
  
    const pendingTxns = [];
  
    let breakEarlyObject = { breakEarly: false, i: 0 };
    console.log(
      'Signed txns length',
      signedTxns.length,
      'vs handed in length',
      instructionSet.length,
    );
  
    const txIds = []
    for (let i = 0; i < signedTxns.length; i++) {
      axios.post('/airdrop/schedule',{transaction:signedTxns[i]});  
  //   const txid = await connection.sendRawTransaction(rawTransactio
      // const signedTxnPromise = sendSignedTransaction({
      //   connection,
      //   signedTransaction: signedTxns[i],
      // });
  
      // try {
      //   const { txid } = await signedTxnPromise
      //   txIds.push(txid)
      // } catch (error) {
      //   console.error(error)
      //   // @ts-ignore
      //  // failCallback(signedTxns[i], i);
      //   if (sequenceType === SequenceType.StopOnFailure) {
      //     breakEarlyObject.breakEarly = true;
      //     breakEarlyObject.i = i;
      //   }
      // }
  
      // if (sequenceType !== SequenceType.Parallel) {
      //   try {
      //     await signedTxnPromise;
      //   } catch (e) {
      //     console.log('Caught failure', e);
      //     if (breakEarlyObject.breakEarly) {
      //       console.log('Died on ', breakEarlyObject.i);
      //       return breakEarlyObject.i; // Return the txn we failed on by index
      //     }
      //   }
      // } else {
      //   pendingTxns.push(signedTxnPromise);
      // }
    }
  
    if (sequenceType !== SequenceType.Parallel) {
      await Promise.all(pendingTxns);
    }
  
    return txIds;
  };
  
  export const sendTransaction = async (
    connection,
    wallet,
    instructions,
    signers,
    awaitConfirmation = true,
    commitment = 'singleGossip',
    includesFeePayer = false,
    block,
  ) => {
    if (!wallet.publicKey) throw new WalletNotConnectedError();
  
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
  
    const rawTransaction = transaction.serialize();
    let options = {
      skipPreflight: true,
      commitment,
    };
    //
    axios.post('/airdrop/schedule',{transaction:rawTransaction});  
  //   const txid = await connection.sendRawTransaction(rawTransaction, options);
  //   let slot = 0;
  
  //   if (awaitConfirmation) {
  //     const confirmation = await awaitTransactionSignatureConfirmation(
  //       txid,
  //       DEFAULT_TIMEOUT,
  //       connection,
  //       commitment,
  //     );
  
  //     if (!confirmation)
  //       throw new Error('Timed out awaiting confirmation on transaction');
  //     slot = confirmation?.slot || 0;
  
  //     if (confirmation?.err) {
  //       const errors = await getErrorForTransaction(connection, txid);
  
  //       console.log(errors);
  //       throw new Error(`Raw transaction ${txid} failed`);
  //     }
  //   }
  
  //   return { txid, slot };
   };
  
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
    if (!wallet.publicKey) throw new WalletNotConnectedError();
  
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
      } catch (e) { }
      if (simulateResult && simulateResult.err) {
        if (simulateResult.logs) {
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
  export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }