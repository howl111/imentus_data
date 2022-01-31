"use strict";
/**
 * Utilities for writing integration tests
 *
 * @module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestToken = exports.toBase58 = exports.toPublicKeys = exports.toBN = exports.TestUtils = void 0;
const anchor_1 = require("@project-serum/anchor");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const pyth_1 = require("./pyth");
class TestUtils {
    constructor(conn, funded) {
        this.conn = conn;
        this.wallet = funded;
        this.authority = this.wallet.payer;
        this.pyth = new pyth_1.PythUtils(conn, funded);
    }
    /**
     * Create a new SPL token
     * @param decimals The number of decimals for the token.
     * @param authority The account with authority to mint/freeze tokens.
     * @returns The new token
     */
    async createToken(decimals, authority = this.authority.publicKey) {
        const token = await spl_token_1.Token.createMint(this.conn, this.authority, authority, authority, decimals, spl_token_1.TOKEN_PROGRAM_ID);
        return new TestToken(this.conn, token, decimals);
    }
    async createNativeToken() {
        const token = new spl_token_1.Token(this.conn, spl_token_1.NATIVE_MINT, spl_token_1.TOKEN_PROGRAM_ID, this.authority);
        return new TestToken(this.conn, token, 9);
    }
    /**
     * Create a new wallet with some initial funding.
     * @param lamports The amount of lamports to fund the wallet account with.
     * @returns The keypair for the new wallet.
     */
    async createWallet(lamports) {
        const wallet = web3_js_1.Keypair.generate();
        const fundTx = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
            fromPubkey: this.wallet.publicKey,
            toPubkey: wallet.publicKey,
            lamports,
        }));
        await (0, web3_js_1.sendAndConfirmTransaction)(this.conn, fundTx, [this.authority]);
        return wallet;
    }
    /**
     * Create a new token account with some initial funding.
     * @param token The token to create an account for
     * @param owner The account that should own these tokens
     * @param amount The initial amount of tokens to provide as funding
     * @returns The address for the created account
     */
    async createTokenAccount(token, owner, amount) {
        if (token.publicKey == spl_token_1.NATIVE_MINT) {
            const account = await spl_token_1.Token.createWrappedNativeAccount(this.conn, spl_token_1.TOKEN_PROGRAM_ID, owner, this.authority, amount.toNumber());
            return account;
        }
        else {
            const account = await token.createAccount(owner);
            await token.mintTo(account, this.authority, [], amount.toNumber());
            return account;
        }
    }
    /**
     * Find a program derived address
     * @param programId The program the address is being derived for
     * @param seeds The seeds to find the address
     * @returns The address found and the bump seed required
     */
    async findProgramAddress(programId, seeds) {
        const seed_bytes = seeds.map((s) => {
            if (typeof s == "string") {
                return Buffer.from(s);
            }
            else if ("publicKey" in s) {
                return s.publicKey.toBytes();
            }
            else if ("toBytes" in s) {
                return s.toBytes();
            }
            else {
                return s;
            }
        });
        return await web3_js_1.PublicKey.findProgramAddress(seed_bytes, programId);
    }
}
exports.TestUtils = TestUtils;
TestUtils.pythProgramId = pyth_1.PythUtils.programId;
/**
 * Convert some value/object to use `BN` type to represent numbers.
 *
 * If the value is a number, its converted to a `BN`. If the value is
 * an object, then each field is (recursively) converted to a `BN`.
 *
 * @param obj The value or object to convert.
 * @returns The object as a`BN`
 */
function toBN(obj) {
    if (typeof obj == "number") {
        return new anchor_1.BN(obj);
    }
    else if (typeof obj == "object") {
        const bnObj = {};
        for (const field in obj) {
            bnObj[field] = toBN(obj[field]);
        }
        return bnObj;
    }
    return obj;
}
exports.toBN = toBN;
/**
 * Convert some object of fields with address-like values,
 * such that the values are converted to their `PublicKey` form.
 * @param obj The object to convert
 */
function toPublicKeys(obj) {
    const newObj = {};
    for (const key in obj) {
        const value = obj[key];
        if (typeof value == "string") {
            newObj[key] = new web3_js_1.PublicKey(value);
        }
        else if ('publicKey' in value) {
            newObj[key] = value.publicKey;
        }
        else {
            newObj[key] = value;
        }
    }
    return newObj;
}
exports.toPublicKeys = toPublicKeys;
/**
 * Convert some object of fields with address-like values,
 * such that the values are converted to their base58 `PublicKey` form.
 * @param obj The object to convert
 */
function toBase58(obj) {
    const newObj = {};
    for (const key in obj) {
        const value = obj[key];
        if (value == undefined) {
            continue;
        }
        else if (typeof value == "string") {
            newObj[key] = value;
        }
        else if ('publicKey' in value) {
            newObj[key] = value.publicKey.toBase58();
        }
        else if ('toBase58' in value && typeof value.toBase58 == "function") {
            newObj[key] = value.toBase58();
        }
        else {
            newObj[key] = value;
        }
    }
    return newObj;
}
exports.toBase58 = toBase58;
class TestToken extends spl_token_1.Token {
    constructor(conn, token, decimals) {
        super(conn, token.publicKey, token.programId, token.payer);
        this.decimals = decimals;
    }
    /**
     * Convert a token amount to the integer format for the mint
     * @param token The token mint
     * @param amount The amount of tokens
     */
    amount(amount) {
        if (typeof amount == "number") {
            amount = new anchor_1.BN(amount);
        }
        const one_unit = new anchor_1.BN(10).pow(new anchor_1.BN(this.decimals));
        return amount.mul(one_unit);
    }
}
exports.TestToken = TestToken;
//# sourceMappingURL=index.js.map