"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketMaker = exports.SerumUtils = exports.DEX_ID_DEVNET = exports.DEX_ID = void 0;
const serum_1 = require("@project-serum/serum");
const web3_js_1 = require("@solana/web3.js");
// import {sendTransaction} from '../../app/src/scripts/programUtil'
const anchor_1 = require("@project-serum/anchor");
const spl_token_1 = require("@solana/spl-token");
const _1 = require(".");
exports.DEX_ID = new web3_js_1.PublicKey("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin");
exports.DEX_ID_DEVNET = new web3_js_1.PublicKey("DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY");
class SerumUtils {
    constructor(utils, devnet) {
        this.utils = utils;
        this.dex_id = devnet ? exports.DEX_ID_DEVNET : exports.DEX_ID;
    }
    async createAccountIx(account, space, programId) {
        return web3_js_1.SystemProgram.createAccount({
            newAccountPubkey: account,
            fromPubkey: this.utils.payer().publicKey,
            lamports: await this.utils
                .connection()
                .getMinimumBalanceForRentExemption(space),
            space,
            programId,
        });
    }
    async createTokenAccountIx(account) {
        return this.createAccountIx(account, spl_token_1.AccountLayout.span, spl_token_1.TOKEN_PROGRAM_ID);
    }
    initTokenAccountIx(account, mint, owner) {
        return spl_token_1.Token.createInitAccountInstruction(spl_token_1.TOKEN_PROGRAM_ID, mint, account, owner);
    }
    /**
     * Create a new Serum market
     * @returns
     */
    async createMarket(info) {
        // Connect to cluster
        const connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)('devnet'), 'confirmed');
        const market = web3_js_1.Keypair.generate();
        console.log("1. Serum Market: ", market.publicKey.toBase58());
        const requestQueue = web3_js_1.Keypair.generate();
        console.log("2. Serum requestQueue: ", requestQueue.publicKey.toBase58());
        const eventQueue = web3_js_1.Keypair.generate();
        console.log("3. Serum eventQueue: ", eventQueue.publicKey.toBase58());
        const bids = web3_js_1.Keypair.generate();
        console.log("4. Serum bids: ", bids.publicKey.toBase58());
        const asks = web3_js_1.Keypair.generate();
        console.log("5. Serum asks: ", asks.publicKey.toBase58());
        const quoteDustThreshold = new anchor_1.BN(100);
        const [vaultOwner, vaultOwnerBump] = await this.findVaultOwner(market.publicKey);
        console.log("6. Serum vaultOwner: ", vaultOwner.toBase58());
        const [baseVault, quoteVault] = await Promise.all([
            this.utils.createTokenAccount(info.baseToken, vaultOwner, new anchor_1.BN(0)),
            this.utils.createTokenAccount(info.quoteToken, vaultOwner, new anchor_1.BN(0)),
        ]);
        console.log("7 Serum baseVault: ", baseVault.toBase58());
        const initMarketTx = this.utils.transaction().add(await this.createAccountIx(market.publicKey, serum_1.Market.getLayout(this.dex_id).span, this.dex_id), await this.createAccountIx(requestQueue.publicKey, 5132, this.dex_id), await this.createAccountIx(eventQueue.publicKey, 262156, this.dex_id), await this.createAccountIx(bids.publicKey, 65548, this.dex_id), await this.createAccountIx(asks.publicKey, 65548, this.dex_id), serum_1.DexInstructions.initializeMarket((0, _1.toPublicKeys)({
            market,
            requestQueue,
            eventQueue,
            bids,
            asks,
            baseVault,
            quoteVault,
            baseMint: info.baseToken.publicKey,
            quoteMint: info.quoteToken.publicKey,
            baseLotSize: new anchor_1.BN(info.baseLotSize),
            quoteLotSize: new anchor_1.BN(info.quoteLotSize),
            feeRateBps: info.feeRateBps,
            vaultSignerNonce: vaultOwnerBump,
            quoteDustThreshold,
            programId: this.dex_id,
        })));
        console.log("8. initMarketTx Completed and payer account: ", initMarketTx.feePayer.toBase58());
        // need to change this code to sendTransaction via Web3js only
        await this.utils.sendAndConfirmTransaction(initMarketTx, [
            market,
            requestQueue,
            eventQueue,
            bids,
            asks,
        ]);
        // let blockhashObj = await connection.getRecentBlockhash();
        // console.log('blockhashObj: ', blockhashObj);
        // initMarketTx.recentBlockhash = await blockhashObj.blockhash;
        // try {
        //         let signature = await sendTransaction(provider,initMarketTx, [
        //         market,
        //         requestQueue,
        //         eventQueue,
        //         bids,
        //         asks,
        //     ]);
        // console.log(" signature for transaction: ", signature)
        // } catch (error) {
        //     console.log('error :', error);
        // }
        console.log("9. sendAndConfirmTransaction initMarketTx Completed");
        return await serum_1.Market.load(this.utils.connection(), market.publicKey, undefined, this.dex_id);
    }
    /**
     * Create a market maker account
     * @param lamports The initial lamport funding for the market maker's wallet
     * @param tokens The list of tokens and amounts to mint for the new market maker
     * @returns Details about the market maker's accounts that were created
     */
    async createMarketMaker(lamports, tokens) {
        const account = await this.utils.createWallet(lamports);
        const tokenAccounts = {};
        const transactions = [];
        for (const [token, amount] of tokens) {
            const publicKey = await this.utils.createTokenAccount(token, account, amount);
            tokenAccounts[token.publicKey.toBase58()] = publicKey;
        }
        return new MarketMaker(this.utils, account, tokenAccounts);
    }
    /**
     * Create a new serum market and fill it with reasonable liquidity
     * @param baseToken The base token, as in BTC
     * @param quoteToken The quote token, as in USD
     * @param marketPrice The price that bids and asks will be created at.
     * @returns
     */
    async createAndMakeMarket(baseToken, quoteToken, marketPrice) {
        const market = await this.createMarket({
            baseToken,
            quoteToken,
            baseLotSize: 100000,
            quoteLotSize: 100,
            feeRateBps: 22,
        });
        const marketMaker = await this.createMarketMaker(1 * web3_js_1.LAMPORTS_PER_SOL, [
            [baseToken, baseToken.amount(100000)],
            [quoteToken, quoteToken.amount(500000)],
        ]);
        const bids = MarketMaker.makeOrders([[marketPrice * 0.995, 10000]]);
        const asks = MarketMaker.makeOrders([[marketPrice * 1.005, 10000]]);
        await marketMaker.placeOrders(market, bids, asks);
        return market;
    }
    async findVaultOwner(market) {
        const bump = new anchor_1.BN(0);
        while (bump.toNumber() < 255) {
            try {
                const vaultOwner = await web3_js_1.PublicKey.createProgramAddress([market.toBuffer(), bump.toArrayLike(Buffer, "le", 8)], this.dex_id);
                return [vaultOwner, bump];
            }
            catch (_e) {
                bump.iaddn(1);
            }
        }
        throw new Error("no seed found for vault owner");
    }
}
exports.SerumUtils = SerumUtils;
class MarketMaker {
    constructor(utils, account, tokenAccounts) {
        this.utils = utils;
        this.account = account;
        this.tokenAccounts = tokenAccounts;
    }
    static makeOrders(orders) {
        return orders.map(([price, size]) => ({ price, size }));
    }
    async placeOrders(market, bids, asks) {
        const baseTokenAccount = this.tokenAccounts[market.baseMintAddress.toBase58()];
        const quoteTokenAccount = this.tokenAccounts[market.quoteMintAddress.toBase58()];
        const askOrderTxs = [];
        const bidOrderTxs = [];
        const placeOrderDefaultParams = {
            owner: this.account.publicKey,
            clientId: undefined,
            openOrdersAddressKey: undefined,
            openOrdersAccount: undefined,
            feeDiscountPubkey: null,
        };
        for (const entry of asks) {
            const { transaction, signers } = await market.makePlaceOrderTransaction(this.utils.connection(), {
                payer: baseTokenAccount,
                side: "sell",
                price: entry.price,
                size: entry.size,
                orderType: "postOnly",
                selfTradeBehavior: "abortTransaction",
                ...placeOrderDefaultParams,
            });
            askOrderTxs.push([transaction, [this.account, ...signers]]);
        }
        for (const entry of bids) {
            const { transaction, signers } = await market.makePlaceOrderTransaction(this.utils.connection(), {
                payer: quoteTokenAccount,
                side: "buy",
                price: entry.price,
                size: entry.size,
                orderType: "postOnly",
                selfTradeBehavior: "abortTransaction",
                ...placeOrderDefaultParams,
            });
            bidOrderTxs.push([transaction, [this.account, ...signers]]);
        }
        await this.utils.sendAndConfirmTransactionSet(...askOrderTxs, ...bidOrderTxs);
    }
}
exports.MarketMaker = MarketMaker;
//# sourceMappingURL=serum.js.map