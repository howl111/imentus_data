"use strict";
/**
 * Utility for interacting with account data directly.
 *
 * Typically useful for mocking information being placed on-chain
 * by other programs, such as price oracles (e.g. Pyth).
 *
 * This depends on the associated `TestWriter` program, which can
 * process instructions to modify an account's data.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataManager = void 0;
const anchor = __importStar(require("@project-serum/anchor"));
const web3 = __importStar(require("@solana/web3.js"));
const web3_js_1 = require("@solana/web3.js");
const writer = anchor.workspace.TestWriter;
class DataManager {
    constructor(conn, wallet) {
        this.conn = conn;
        this.wallet = wallet;
    }
    /**
     * Create a new account for storing arbitrary data
     * @param space The data size to reserve for this account
     * @returns The keypair for the created accounts.
     */
    async createAccount(space) {
        const newAccount = web3_js_1.Keypair.generate();
        const createTx = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.createAccount({
            fromPubkey: this.wallet.publicKey,
            newAccountPubkey: newAccount.publicKey,
            programId: writer.programId,
            lamports: await this.conn.getMinimumBalanceForRentExemption(space),
            space,
        }));
        await web3.sendAndConfirmTransaction(this.conn, createTx, [
            this.wallet.payer,
            newAccount,
        ]);
        return newAccount;
    }
    /**
     * Change the data stored in a configuration account
     * @param account The keypair for the account to modify
     * @param offset The starting offset of the section of the account data to modify.
     * @param input The data to store in the account
     */
    async store(account, offset, input) {
        const writeInstr = writer.instruction.write(new anchor.BN(offset), input, {
            accounts: { target: account.publicKey },
        });
        const writeTx = new web3_js_1.Transaction({
            feePayer: this.wallet.publicKey,
        }).add(writeInstr);
        await web3.sendAndConfirmTransaction(this.conn, writeTx, [
            account,
            this.wallet.payer,
        ]);
    }
}
exports.DataManager = DataManager;
DataManager.programId = writer.programId;
//# sourceMappingURL=data.js.map