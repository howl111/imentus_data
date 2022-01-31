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
exports.LiquidateDexInstruction = exports.JetUtils = void 0;
const web3_js_1 = require("@solana/web3.js");
const data_1 = require("./data");
const _1 = require(".");
const spl_token_1 = require("@solana/spl-token");
const anchor = __importStar(require("@project-serum/anchor"));
const jet_client_1 = require("@jet-lab/jet-client");
class JetUtils {
    constructor(conn, wallet, program, devnet) {
        this.conn = conn;
        this.wallet = wallet;
        this.config = new data_1.DataManager(conn, wallet);
        this.utils = new _1.TestUtils(conn, wallet);
        this.program = program;
        this.dex_id = devnet ? jet_client_1.DEX_ID_DEVNET : jet_client_1.DEX_ID;
    }
    async createReserveAccount(tokenMint, dexMarket, pythPrice, pythProduct, faucet) {
        const reserve = web3_js_1.Keypair.generate();
        const [depositNoteMint, depositNoteMintBump] = await this.utils.findProgramAddress(this.program.programId, [
            "deposits",
            reserve,
            tokenMint,
        ]);
        const [loanNoteMint, loanNoteMintBump] = await this.utils.findProgramAddress(this.program.programId, [
            "loans",
            reserve,
            tokenMint,
        ]);
        const [depositNoteDest, depositNoteDestBump] = await this.utils.findProgramAddress(this.program.programId, [
            reserve,
            this.wallet,
        ]);
        const [vault, vaultBump] = await this.utils.findProgramAddress(this.program.programId, ["vault", reserve]);
        const [feeNoteVault, feeNoteVaultBump] = await this.utils.findProgramAddress(this.program.programId, [
            "fee-vault",
            reserve,
        ]);
        const [dexSwapTokens, dexSwapTokensBump] = await this.utils.findProgramAddress(this.program.programId, [
            "dex-swap-tokens",
            reserve,
        ]);
        const [dexOpenOrders, dexOpenOrdersBump] = await this.utils.findProgramAddress(this.program.programId, [
            "dex-open-orders",
            reserve,
        ]);
        return {
            accounts: {
                reserve,
                vault,
                feeNoteVault,
                dexOpenOrders,
                dexSwapTokens,
                tokenMint,
                dexMarket,
                pythPrice,
                pythProduct,
                depositNoteMint,
                loanNoteMint,
                faucet,
            },
            bump: {
                vault: vaultBump,
                feeNoteVault: feeNoteVaultBump,
                dexOpenOrders: dexOpenOrdersBump,
                dexSwapTokens: dexSwapTokensBump,
                depositNoteMint: depositNoteMintBump,
                loanNoteMint: loanNoteMintBump,
            },
        };
    }
    async initReserve(reserve, reserveConfig, market, marketOwner, quoteTokenMint) {
        let [marketAuthority] = await this.findMarketAuthorityAddress(market);
        return await this.program.rpc.initReserve(reserve.bump, reserveConfig, {
            accounts: (0, _1.toPublicKeys)({
                market,
                marketAuthority,
                owner: marketOwner,
                oracleProduct: reserve.accounts.pythProduct,
                oraclePrice: reserve.accounts.pythPrice,
                quoteTokenMint,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                dexProgram: this.dex_id,
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
exports.LiquidateDexInstruction = {
    name: "liquidateDex",
    accounts: [
        {
            name: "sourceMarket",
            accounts: [
                {
                    name: "market",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "openOrders",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "requestQueue",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "eventQueue",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "bids",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "asks",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "coinVault",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "pcVault",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "vaultSigner",
                    isMut: false,
                    isSigner: false,
                },
            ],
        },
        {
            name: "targetMarket",
            accounts: [
                {
                    name: "market",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "openOrders",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "requestQueue",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "eventQueue",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "bids",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "asks",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "coinVault",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "pcVault",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "vaultSigner",
                    isMut: false,
                    isSigner: false,
                },
            ],
        },
        {
            name: "market",
            isMut: false,
            isSigner: false,
        },
        {
            name: "marketAuthority",
            isMut: false,
            isSigner: false,
        },
        {
            name: "obligation",
            isMut: true,
            isSigner: false,
        },
        {
            name: "loanReserve",
            isMut: true,
            isSigner: false,
        },
        {
            name: "loanReserveVault",
            isMut: true,
            isSigner: false,
        },
        {
            name: "loanNoteMint",
            isMut: true,
            isSigner: false,
        },
        {
            name: "loanAccount",
            isMut: true,
            isSigner: false,
        },
        {
            name: "collateralReserve",
            isMut: false,
            isSigner: false,
        },
        {
            name: "collateralReserveVault",
            isMut: true,
            isSigner: false,
        },
        {
            name: "depositNoteMint",
            isMut: true,
            isSigner: false,
        },
        {
            name: "collateralAccount",
            isMut: true,
            isSigner: false,
        },
        {
            name: "dexSwapTokens",
            isMut: true,
            isSigner: false,
        },
        {
            name: "dexProgram",
            isMut: false,
            isSigner: false,
        },
        {
            name: "tokenProgram",
            isMut: false,
            isSigner: false,
        },
        {
            name: "rent",
            isMut: false,
            isSigner: false,
        },
    ],
    args: [],
};
//# sourceMappingURL=jet.js.map