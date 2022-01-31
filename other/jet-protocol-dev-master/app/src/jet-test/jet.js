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
exports.JetUtils = void 0;
const web3_js_1 = require("@solana/web3.js");
const data_1 = require("./data");
const _1 = require(".");
const spl_token_1 = require("@solana/spl-token");
const anchor = __importStar(require("@project-serum/anchor"));
class JetUtils {
    constructor(conn, wallet, program) {
        this.conn = conn;
        this.wallet = wallet;
        this.config = new data_1.DataManager(conn, wallet);
        this.utils = new _1.TestUtils(conn, wallet);
        this.program = program;
    }
    async createReserveAccount(tokenMint, initial_amount, market, marketOwner) {
        const reserve = web3_js_1.Keypair.generate();
        const [depositNoteMint, depositNoteMintBump] = await this.utils.findProgramAddress(this.program.programId, [
            "deposits",
            reserve,
            tokenMint,
        ]);
        const [loanNoteMint, loanNoteMintBump] = await this.utils.findProgramAddress(this.program.programId, ["loans", reserve, tokenMint]);
        const [depositNoteDest, depositNoteDestBump] = await this.utils.findProgramAddress(this.program.programId, [
            reserve,
            this.wallet,
        ]);
        const [vault, vaultBump] = await this.utils.findProgramAddress(this.program.programId, [market, reserve]);
        const tokenSource = await this.utils.createTokenAccount(tokenMint, marketOwner, initial_amount);
        return {
            accounts: {
                reserve,
                tokenSource,
                vault,
                tokenMint,
                depositNoteMint,
                depositNoteDest,
                loanNoteMint,
            },
            bump: {
                vault: vaultBump,
                depositNoteMint: depositNoteMintBump,
                depositNoteDest: depositNoteDestBump,
                loanNoteMint: loanNoteMintBump,
            },
        };
    }
    async initReserve(reserve, reserveConfig, liquidityAmount, market, marketOwner, pythProduct, pythPrice) {
        let [marketAuthority] = await this.findMarketAuthorityAddress(market);
        return await this.program.rpc.initReserve(reserve.bump, reserveConfig, liquidityAmount, {
            accounts: (0, _1.toPublicKeys)({
                market,
                marketAuthority,
                owner: marketOwner,
                oracleProduct: pythProduct,
                oraclePrice: pythPrice,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                systemProgram: anchor.web3.SystemProgram.programId,
                ...reserve.accounts,
            }),
            signers: [reserve.accounts.reserve],
            instructions: [
                await this.program.account.reserve.createInstruction(reserve.accounts.reserve),
            ],
        });
    }
    async findMarketAuthorityAddress(market) {
        return web3_js_1.PublicKey.findProgramAddress([market.toBuffer()], this.program.programId);
    }
}
exports.JetUtils = JetUtils;
JetUtils.programId = data_1.DataManager.programId;
//# sourceMappingURL=jet.js.map