"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JetReserve = void 0;
const serum_1 = require("@project-serum/serum");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const _1 = require(".");
const market_1 = require("./market");
class JetReserve {
    constructor(client, market, address, data) {
        this.client = client;
        this.market = market;
        this.address = address;
        this.data = data;
        this.conn = this.client.program.provider.connection;
    }
    async refresh() {
        let tx = new web3_js_1.Transaction().add(this.makeRefreshIx());
        return await this.client.program.provider.send(tx);
    }
    makeRefreshIx() {
        return this.client.program.instruction.refreshReserve({
            accounts: {
                market: this.market.address,
                marketAuthority: this.market.marketAuthority,
                reserve: this.address,
                feeNoteVault: this.data.feeNoteVault,
                depositNoteMint: this.data.depositNoteMint,
                pythOraclePrice: this.data.pythOraclePrice,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            },
        });
    }
    async loadDexMarketAccounts() {
        if (this.data.tokenMint.equals(this.market.quoteTokenMint)) {
            // The quote token doesn't have a DEX market
            const defaultAccount = this.data.dexSwapTokens;
            return {
                market: defaultAccount,
                openOrders: defaultAccount,
                requestQueue: defaultAccount,
                eventQueue: defaultAccount,
                bids: defaultAccount,
                asks: defaultAccount,
                coinVault: defaultAccount,
                pcVault: defaultAccount,
                vaultSigner: defaultAccount,
            };
        }
        const dexMarketData = await this.conn.getAccountInfo(this.data.dexMarket);
        const dexMarket = await serum_1.Market.getLayout(_1.DEX_ID).decode(dexMarketData?.data);
        const dexSignerNonce = dexMarket.vaultSignerNonce;
        const vaultSigner = await web3_js_1.PublicKey.createProgramAddress([
            dexMarket.ownAddress.toBuffer(),
            dexSignerNonce.toArrayLike(Buffer, "le", 8),
        ], this.client.devnet ? _1.DEX_ID_DEVNET : _1.DEX_ID);
        return {
            market: dexMarket.ownAddress,
            openOrders: this.data.dexOpenOrders,
            requestQueue: dexMarket.requestQueue,
            eventQueue: dexMarket.eventQueue,
            bids: dexMarket.bids,
            asks: dexMarket.asks,
            coinVault: dexMarket.baseVault,
            pcVault: dexMarket.quoteVault,
            vaultSigner,
        };
    }
    async updateReserveConfig(params) {
        await this.client.program.rpc.updateReserveConfig(params.config, {
            accounts: {
                market: params.market,
                reserve: params.reserve,
                owner: params.owner.publicKey,
            },
            signers: [params.owner],
        });
    }
    static async load(client, address, maybeMarket) {
        const data = (await client.program.account.reserve.fetch(address));
        const market = maybeMarket || (await market_1.JetMarket.load(client, data.market));
        return new JetReserve(client, market, address, data);
    }
    /**
     * Derive all the associated accounts for a reserve.
     * @param address The reserve address to derive the accounts for.
     * @param tokenMint The address of the mint for the token stored in the reserve.
     * @param market The address of the market the reserve belongs to.
     */
    static async deriveAccounts(client, address, tokenMint) {
        return {
            vault: await client.findDerivedAccount(["vault", address]),
            feeNoteVault: await client.findDerivedAccount(["fee-vault", address]),
            dexSwapTokens: await client.findDerivedAccount([
                "dex-swap-tokens",
                address,
            ]),
            dexOpenOrders: await client.findDerivedAccount([
                "dex-open-orders",
                address,
            ]),
            loanNoteMint: await client.findDerivedAccount([
                "loans",
                address,
                tokenMint,
            ]),
            depositNoteMint: await client.findDerivedAccount([
                "deposits",
                address,
                tokenMint,
            ]),
        };
    }
}
exports.JetReserve = JetReserve;
//# sourceMappingURL=reserve.js.map