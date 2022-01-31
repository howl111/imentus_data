import { PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { CreateMarketParams, JetMarket } from './market';
export declare class DerivedAccount {
    address: PublicKey;
    bumpSeed: number;
    constructor(address: PublicKey, bumpSeed: number);
}
interface ToBytes {
    toBytes(): Uint8Array;
}
interface HasPublicKey {
    publicKey: PublicKey;
}
declare type DerivedAccountSeed = HasPublicKey | ToBytes | Uint8Array | string;
export declare class JetClient {
    program: anchor.Program;
    devnet?: boolean;
    constructor(program: anchor.Program, devnet?: boolean);
    /**
     * Create a new client for interacting with the Jet lending program.
     * @param provider The provider with wallet/network access that can be used to send transactions.
     * @returns The client
     */
    static connect(provider: anchor.Provider, devnet?: boolean): Promise<JetClient>;
    /**
     * Find a PDA
     * @param seeds
     * @returns
     */
    findDerivedAccount(seeds: DerivedAccountSeed[]): Promise<DerivedAccount>;
    createMarket(params: CreateMarketParams): Promise<JetMarket>;
}
export {};
