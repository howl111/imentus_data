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
exports.JetClient = exports.DerivedAccount = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor = __importStar(require("@project-serum/anchor"));
const _1 = require(".");
const market_1 = require("./market");
class DerivedAccount {
    constructor(address, bumpSeed) {
        this.address = address;
        this.bumpSeed = bumpSeed;
    }
}
exports.DerivedAccount = DerivedAccount;
class JetClient {
    constructor(program, devnet) {
        this.program = program;
        this.devnet = devnet;
    }
    /**
     * Create a new client for interacting with the Jet lending program.
     * @param provider The provider with wallet/network access that can be used to send transactions.
     * @returns The client
     */
    static async connect(provider, devnet) {
        const idl = await anchor.Program.fetchIdl(_1.JET_ID, provider);
        const program = new anchor.Program(idl, _1.JET_ID, provider);
        return new JetClient(program, devnet);
    }
    /**
     * Find a PDA
     * @param seeds
     * @returns
     */
    async findDerivedAccount(seeds) {
        const seedBytes = seeds.map((s) => {
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
        const [address, bumpSeed] = await web3_js_1.PublicKey.findProgramAddress(seedBytes, this.program.programId);
        return new DerivedAccount(address, bumpSeed);
    }
    async createMarket(params) {
        let account = params.account;
        if (account == undefined) {
            account = web3_js_1.Keypair.generate();
        }
        await this.program.rpc.initMarket(params.owner, params.quoteCurrencyName, params.quoteCurrencyMint, {
            accounts: {
                market: account.publicKey,
            },
            signers: [account],
            instructions: [
                await this.program.account.market.createInstruction(account),
            ],
        });
        return market_1.JetMarket.load(this, account.publicKey);
    }
}
exports.JetClient = JetClient;
//# sourceMappingURL=client.js.map