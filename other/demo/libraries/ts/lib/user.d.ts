/// <reference types="bn.js" />
import { PublicKey, Transaction } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { Amount } from ".";
import { JetClient } from "./client";
import { JetMarket } from "./market";
import { JetReserve } from "./reserve";
export declare class TokenAmount {
    mint: PublicKey;
    amount: anchor.BN;
    constructor(mint: PublicKey, amount: anchor.BN);
}
export interface User {
    address: PublicKey;
    deposits(): TokenAmount[];
    collateral(): TokenAmount[];
    /**
     * Get the loans held by the user
     */
    loans(): TokenAmount[];
}
export declare class JetUser implements User {
    private client;
    market: JetMarket;
    address: PublicKey;
    private obligation;
    private _deposits;
    private _collateral;
    private _loans;
    private conn;
    private constructor();
    static load(client: JetClient, market: JetMarket, address: PublicKey): Promise<JetUser>;
    liquidateDex(loanReserve: JetReserve, collateralReserve: JetReserve): Promise<string>;
    makeLiquidateDexTx(loanReserve: JetReserve, collateralReserve: JetReserve): Promise<Transaction>;
    liquidate(loanReserve: JetReserve, collateralReserve: JetReserve, payerAccount: PublicKey, receiverAccount: PublicKey, amount: Amount): Promise<string>;
    makeLiquidateTx(_loanReserve: JetReserve, _collateralReserve: JetReserve, _payerAccount: PublicKey, _receiverAccount: PublicKey, _amount: Amount): Promise<Transaction>;
    repay(reserve: JetReserve, tokenAccount: PublicKey, amount: Amount): Promise<string>;
    makeRepayTx(reserve: JetReserve, tokenAccount: PublicKey, amount: Amount): Promise<Transaction>;
    withdrawCollateral(reserve: JetReserve, amount: Amount): Promise<string>;
    makeWithdrawCollateralTx(reserve: JetReserve, amount: Amount): Promise<Transaction>;
    withdraw(reserve: JetReserve, tokenAccount: PublicKey, amount: Amount): Promise<string>;
    makeWithdrawTx(reserve: JetReserve, tokenAccount: PublicKey, amount: Amount): Promise<Transaction>;
    deposit(reserve: JetReserve, tokenAccount: PublicKey, amount: Amount): Promise<string>;
    makeDepositTx(reserve: JetReserve, tokenAccount: PublicKey, amount: Amount): Promise<Transaction>;
    depositCollateral(reserve: JetReserve, amount: Amount): Promise<string>;
    makeDepositCollateralTx(reserve: JetReserve, amount: Amount): Promise<Transaction>;
    borrow(reserve: JetReserve, receiver: PublicKey, amount: Amount): Promise<string>;
    makeBorrowTx(reserve: JetReserve, receiver: PublicKey, amount: Amount): Promise<Transaction>;
    private makeInitDepositAccountIx;
    private makeInitCollateralAccountIx;
    private makeInitLoanAccountIx;
    private makeInitObligationAccountIx;
    refresh(): Promise<void>;
    private refreshReserve;
    private refreshAccount;
    private findReserveAccounts;
    /**
     * Get all the deposits held by the user, excluding those amounts being
     * used as collateral for a loan.
     */
    deposits(): TokenAmount[];
    /**
     * Get all the collateral deposits held by the user.
     */
    collateral(): TokenAmount[];
    /**
     * Get the loans held by the user
     */
    loans(): TokenAmount[];
}
