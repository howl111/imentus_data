/// <reference types="bn.js" />
import { PublicKey, Keypair } from "@solana/web3.js";
import { u64 } from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import { CreateReserveParams, JetReserve } from "./reserve";
import { JetClient } from ".";
export interface JetMarketReserveInfo {
    address: PublicKey;
    price: anchor.BN;
    depositNoteExchangeRate: anchor.BN;
    loanNoteExchangeRate: anchor.BN;
}
export interface JetMarketData {
    quoteTokenMint: PublicKey;
    quoteCurrency: string;
    marketAuthority: PublicKey;
    owner: PublicKey;
    reserves: JetMarketReserveInfo[];
}
export declare class JetMarket implements JetMarketData {
    private client;
    address: PublicKey;
    quoteTokenMint: PublicKey;
    quoteCurrency: string;
    marketAuthority: PublicKey;
    owner: PublicKey;
    reserves: JetMarketReserveInfo[];
    private constructor();
    private static fetchData;
    /**
     * Load the market account data from the network.
     * @param client The program client
     * @param address The address of the market.
     * @returns An object for interacting with the Jet market.
     */
    static load(client: JetClient, address: PublicKey): Promise<JetMarket>;
    /**
     * Get the latest market account data from the network.
     */
    refresh(): Promise<void>;
    setFlags(flags: u64): Promise<void>;
    createReserve(params: CreateReserveParams): Promise<JetReserve>;
}
export interface CreateMarketParams {
    /**
     * The address that must sign to make future changes to the market,
     * such as modifying the available reserves (or their configuation)
     */
    owner: PublicKey;
    /**
     * The token mint for the currency being used to quote the value of
     * all other tokens stored in reserves.
     */
    quoteCurrencyMint: PublicKey;
    /**
     * The name of the currency used for quotes, this has to match the
     * name specified in any Pyth/oracle accounts.
     */
    quoteCurrencyName: string;
    /**
     * The account to use for the market data.
     *
     * If not provided an account will be generated.
     */
    account?: Keypair;
}
export declare enum MarketFlags {
    HaltBorrows = 1,
    HaltRepays = 2,
    HaltDeposits = 4,
    HaltAll = 7
}
