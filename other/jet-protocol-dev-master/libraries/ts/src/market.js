"use strict";
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
exports.MarketFlags = exports.JetMarket = void 0;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const anchor = __importStar(require("@project-serum/anchor"));
const BL = __importStar(require("@solana/buffer-layout"));
const reserve_1 = require("./reserve");
const _1 = require(".");
const util = __importStar(require("./util"));
const MAX_RESERVES = 32;
const ReserveInfoStruct = BL.struct([
    util.pubkeyField("reserve"),
    BL.blob(80, "_UNUSED_0_"),
    util.numberField("price"),
    util.numberField("depositNoteExchangeRate"),
    util.numberField("loanNoteExchangeRate"),
    BL.blob(72, "_UNUSED_1_"),
]);
const MarketReserveInfoList = BL.seq(ReserveInfoStruct, MAX_RESERVES);
class JetMarket {
    constructor(client, address, quoteTokenMint, quoteCurrency, marketAuthority, owner, reserves) {
        this.client = client;
        this.address = address;
        this.quoteTokenMint = quoteTokenMint;
        this.quoteCurrency = quoteCurrency;
        this.marketAuthority = marketAuthority;
        this.owner = owner;
        this.reserves = reserves;
    }
    static async fetchData(client, address) {
        let data = await client.program.account.market.fetch(address);
        let reserveInfoData = new Uint8Array(data.reserves);
        let reserveInfoList = MarketReserveInfoList.decode(reserveInfoData);
        return [data, reserveInfoList];
    }
    /**
     * Load the market account data from the network.
     * @param client The program client
     * @param address The address of the market.
     * @returns An object for interacting with the Jet market.
     */
    static async load(client, address) {
        const [data, reserveInfoList] = await JetMarket.fetchData(client, address);
        return new JetMarket(client, address, data.quoteTokenMint, data.quoteCurrency, data.marketAuthority, data.owner, reserveInfoList);
    }
    /**
     * Get the latest market account data from the network.
     */
    async refresh() {
        const [data, reserveInfoList] = await JetMarket.fetchData(this.client, this.address);
        this.reserves = reserveInfoList;
        this.owner = data.owner;
        this.marketAuthority = data.marketAuthority;
        this.quoteCurrency = data.quoteCurrency;
        this.quoteTokenMint = data.quoteTokenMint;
    }
    async setFlags(flags) {
        await this.client.program.rpc.setMarketFlags(flags, {
            accounts: {
                market: this.address,
                owner: this.owner
            }
        });
    }
    async createReserve(params) {
        let account = params.account;
        if (account == undefined) {
            account = web3_js_1.Keypair.generate();
        }
        const derivedAccounts = await reserve_1.JetReserve.deriveAccounts(this.client, account.publicKey, params.tokenMint);
        const bumpSeeds = {
            vault: derivedAccounts.vault.bumpSeed,
            feeNoteVault: derivedAccounts.feeNoteVault.bumpSeed,
            dexOpenOrders: derivedAccounts.dexOpenOrders.bumpSeed,
            dexSwapTokens: derivedAccounts.dexSwapTokens.bumpSeed,
            loanNoteMint: derivedAccounts.loanNoteMint.bumpSeed,
            depositNoteMint: derivedAccounts.depositNoteMint.bumpSeed,
        };
        const createReserveAccount = await this.client.program.account.reserve.createInstruction(account);
        const dexProgram = this.client.devnet ? _1.DEX_ID_DEVNET : _1.DEX_ID;
        await this.client.program.rpc.initReserve(bumpSeeds, params.config, {
            accounts: {
                market: this.address,
                marketAuthority: this.marketAuthority,
                owner: this.owner,
                oracleProduct: params.pythOracleProduct,
                oraclePrice: params.pythOraclePrice,
                reserve: account.publicKey,
                vault: derivedAccounts.vault.address,
                feeNoteVault: derivedAccounts.feeNoteVault.address,
                dexSwapTokens: derivedAccounts.dexSwapTokens.address,
                dexOpenOrders: derivedAccounts.dexOpenOrders.address,
                loanNoteMint: derivedAccounts.loanNoteMint.address,
                depositNoteMint: derivedAccounts.depositNoteMint.address,
                dexMarket: params.dexMarket,
                quoteTokenMint: this.quoteTokenMint,
                tokenMint: params.tokenMint,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                dexProgram: this.client.devnet ? _1.DEX_ID_DEVNET : _1.DEX_ID,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            instructions: [createReserveAccount],
            signers: [account],
        });
        return reserve_1.JetReserve.load(this.client, account.publicKey, this);
    }
}
exports.JetMarket = JetMarket;
var MarketFlags;
(function (MarketFlags) {
    MarketFlags[MarketFlags["HaltBorrows"] = 1] = "HaltBorrows";
    MarketFlags[MarketFlags["HaltRepays"] = 2] = "HaltRepays";
    MarketFlags[MarketFlags["HaltDeposits"] = 4] = "HaltDeposits";
    MarketFlags[MarketFlags["HaltAll"] = 7] = "HaltAll";
})(MarketFlags = exports.MarketFlags || (exports.MarketFlags = {}));
//# sourceMappingURL=market.js.map