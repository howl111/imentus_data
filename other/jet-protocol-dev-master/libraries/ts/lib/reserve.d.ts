/// <reference types="bn.js" />
import * as anchor from "@project-serum/anchor";
import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { JetClient, DerivedAccount } from "./client";
import { JetMarket } from "./market";
export interface ReserveConfig {
    utilizationRate1: number;
    utilizationRate2: number;
    borrowRate0: number;
    borrowRate1: number;
    borrowRate2: number;
    borrowRate3: number;
    minCollateralRatio: number;
    liquidationPremium: number;
    manageFeeCollectionThreshold: anchor.BN;
    manageFeeRate: number;
    loanOriginationFee: number;
    liquidationSlippage: number;
    liquidationDexTradeMax: anchor.BN;
}
export interface ReserveAccounts {
    vault: DerivedAccount;
    feeNoteVault: DerivedAccount;
    dexSwapTokens: DerivedAccount;
    dexOpenOrders: DerivedAccount;
    loanNoteMint: DerivedAccount;
    depositNoteMint: DerivedAccount;
}
export interface CreateReserveParams {
    /**
     * The Serum market for the reserve.
     */
    dexMarket: PublicKey;
    /**
     * The mint for the token to be stored in the reserve.
     */
    tokenMint: PublicKey;
    /**
     * The Pyth account containing the price information for the reserve token.
     */
    pythOraclePrice: PublicKey;
    /**
     * The Pyth account containing the metadata about the reserve token.
     */
    pythOracleProduct: PublicKey;
    /**
     * The initial configuration for the reserve
     */
    config: ReserveConfig;
    /**
     * The account to use for the reserve data.
     *
     * If not provided an account will be generated.
     */
    account?: Keypair;
}
export interface ReserveData {
    index: number;
    market: PublicKey;
    pythOraclePrice: PublicKey;
    pythOracleProduct: PublicKey;
    tokenMint: PublicKey;
    depositNoteMint: PublicKey;
    loanNoteMint: PublicKey;
    vault: PublicKey;
    feeNoteVault: PublicKey;
    dexOpenOrders: PublicKey;
    dexSwapTokens: PublicKey;
    dexMarket: PublicKey;
}
export interface ReserveDexMarketAccounts {
    market: PublicKey;
    openOrders: PublicKey;
    requestQueue: PublicKey;
    eventQueue: PublicKey;
    bids: PublicKey;
    asks: PublicKey;
    coinVault: PublicKey;
    pcVault: PublicKey;
    vaultSigner: PublicKey;
}
export interface UpdateReserveConfigParams {
    config: ReserveConfig;
    reserve: PublicKey;
    market: PublicKey;
    owner: Keypair;
}
export declare class JetReserve {
    private client;
    private market;
    address: PublicKey;
    data: ReserveData;
    private conn;
    constructor(client: JetClient, market: JetMarket, address: PublicKey, data: ReserveData);
    refresh(): Promise<string>;
    makeRefreshIx(): TransactionInstruction;
    loadDexMarketAccounts(): Promise<ReserveDexMarketAccounts>;
    updateReserveConfig(params: UpdateReserveConfigParams): Promise<void>;
    static load(client: JetClient, address: PublicKey, maybeMarket?: JetMarket): Promise<JetReserve>;
    /**
     * Derive all the associated accounts for a reserve.
     * @param address The reserve address to derive the accounts for.
     * @param tokenMint The address of the mint for the token stored in the reserve.
     * @param market The address of the market the reserve belongs to.
     */
    static deriveAccounts(client: JetClient, address: PublicKey, tokenMint: PublicKey): Promise<ReserveAccounts>;
}
