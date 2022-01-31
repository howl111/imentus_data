/// <reference types="bn.js" />
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { u64 } from "@solana/spl-token";
export { JetClient } from "./client";
export { JetMarket, MarketFlags } from "./market";
export { JetReserve, ReserveConfig } from "./reserve";
export { JetUser } from "./user";
export declare const PLACEHOLDER_ACCOUNT: PublicKey;
export declare const DEX_ID: PublicKey;
export declare const DEX_ID_DEVNET: PublicKey;
export declare const JET_ID: PublicKey;
export declare type AmountUnits = {
    tokens: {};
} | {
    depositNotes: {};
} | {
    loanNotes: {};
};
export declare class Amount {
    units: AmountUnits;
    value: anchor.BN;
    constructor(units: AmountUnits, value: anchor.BN);
    static tokens(amount: number | u64): Amount;
    static depositNotes(amount: number | u64): Amount;
    static loanNotes(amount: number | u64): Amount;
}
