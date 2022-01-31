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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const utils_1 = require("../tests/utils");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const anchor = __importStar(require("@project-serum/anchor"));
const jet_1 = require("../tests/utils/jet");
const chai_1 = require("chai");
const serum_1 = require("../tests/utils/serum");
const anchor_1 = require("@project-serum/anchor");
const main = async () => {
    console.log("Migrating...");
    let cluster = "https://api.devnet.solana.com";
    const connection = new web3_js_1.Connection(cluster, anchor.Provider.defaultOptions().commitment);
    const wallet = anchor.Wallet.local();
    let provider = new anchor.Provider(connection, wallet, anchor.Provider.defaultOptions());
    anchor.setProvider(provider);
    // add pubkeys to the idl
    const idlPath = path_1.default.resolve("target/idl/jet.json");
    const idlWebPath = path_1.default.resolve("app/public/idl/localnet/jet.json");
    const idl = JSON.parse(fs_1.default.readFileSync(idlPath, "utf-8"));
    const program = new anchor.Program(idl, idl.metadata.address);
    const utils = new utils_1.TestUtils(provider.connection, wallet);
    const jetUtils = new jet_1.JetUtils(provider.connection, wallet, program, false);
    const serumUtils = new serum_1.SerumUtils(utils, false);
    const market = web3_js_1.Keypair.generate();
    let [marketAuthority] = await jetUtils.findMarketAuthorityAddress(market.publicKey);
    const marketOwner = wallet.publicKey;
    console.log("Creating mints and pyth accounts...");
    const usdcPythPrice = await utils.pyth.createPriceAccount();
    const usdcPythProduct = await utils.pyth.createProductAccount();
    const usdcMint = await utils.createToken(6);
    const wsolPythPrice = await utils.pyth.createPriceAccount();
    const wsolPythProduct = await utils.pyth.createProductAccount();
    const wsolMint = await utils.createNativeToken();
    const btcPythPrice = await utils.pyth.createPriceAccount();
    const btcPythProduct = await utils.pyth.createProductAccount();
    const btcMint = await utils.createToken(6);
    const ethPythPrice = await utils.pyth.createPriceAccount();
    const ethPythProduct = await utils.pyth.createProductAccount();
    const ethMint = await utils.createToken(6);
    const quoteTokenMint = usdcMint.publicKey;
    console.log("Setting prices...");
    await utils.pyth.updatePriceAccount(usdcPythPrice, {
        aggregatePriceInfo: {
            price: 1n,
        },
    });
    await utils.pyth.updateProductAccount(usdcPythProduct, {
        priceAccount: usdcPythPrice.publicKey,
        attributes: {
            quote_currency: "USD",
        },
    });
    await utils.pyth.updatePriceAccount(wsolPythPrice, {
        aggregatePriceInfo: {
            price: 71n,
        },
    });
    await utils.pyth.updateProductAccount(wsolPythProduct, {
        priceAccount: wsolPythPrice.publicKey,
        attributes: {
            quote_currency: "USD",
        },
    });
    await utils.pyth.updatePriceAccount(btcPythPrice, {
        aggregatePriceInfo: {
            price: 72231n,
        },
    });
    await utils.pyth.updateProductAccount(btcPythProduct, {
        priceAccount: btcPythPrice.publicKey,
        attributes: {
            quote_currency: "USD",
        },
    });
    await utils.pyth.updatePriceAccount(ethPythPrice, {
        aggregatePriceInfo: {
            price: 2916n,
        },
    });
    await utils.pyth.updateProductAccount(ethPythProduct, {
        priceAccount: ethPythPrice.publicKey,
        attributes: {
            quote_currency: "USD",
        },
    });
    // Create dex markets
    const createMarketOpts = {
        baseLotSize: 100000,
        quoteLotSize: 100,
        feeRateBps: 22,
    };
    console.log("Initializing sol/usdc serum markets...");
    const wsolUsdcMarket = await serumUtils.createMarket({ ...createMarketOpts, baseToken: wsolMint, quoteToken: usdcMint });
    console.log("Initializing btc/usdc serum markets...");
    const btcUsdcMarket = await serumUtils.createMarket({ ...createMarketOpts, baseToken: btcMint, quoteToken: usdcMint });
    console.log("Initializing eth/usdc serum markets...");
    const ethUsdcMarket = await serumUtils.createMarket({ ...createMarketOpts, baseToken: ethMint, quoteToken: usdcMint });
    await program.rpc.initMarket(marketOwner, "USD", quoteTokenMint, {
        accounts: (0, utils_1.toPublicKeys)({
            market,
        }),
        signers: [market],
        instructions: [
            await program.account.market.createInstruction(market),
        ],
    });
    const reserveConfig = {
        utilizationRate1: new anchor_1.BN(8500),
        utilizationRate2: new anchor_1.BN(9500),
        borrowRate0: new anchor_1.BN(50),
        borrowRate1: new anchor_1.BN(600),
        borrowRate2: new anchor_1.BN(4000),
        borrowRate3: new anchor_1.BN(1600),
        minCollateralRatio: new anchor_1.BN(12500),
        liquidationPremium: new anchor_1.BN(300),
        manageFeeRate: new anchor_1.BN(0),
        manageFeeCollectionThreshold: new anchor_1.BN(10),
        loanOriginationFee: new anchor_1.BN(0),
        liquidationSlippage: new anchor_1.BN(300),
        liquidationDexTradeMax: new anchor_1.BN(100),
    };
    let usdcReserveAccounts = await jetUtils.createReserveAccount(usdcMint, wsolUsdcMarket.publicKey, usdcPythPrice.publicKey, usdcPythProduct.publicKey);
    let wsolReserveAccounts = await jetUtils.createReserveAccount(wsolMint, wsolUsdcMarket.publicKey, wsolPythPrice.publicKey, wsolPythProduct.publicKey);
    let btcReserveAccounts = await jetUtils.createReserveAccount(btcMint, btcUsdcMarket.publicKey, btcPythPrice.publicKey, btcPythProduct.publicKey);
    let ethReserveAccounts = await jetUtils.createReserveAccount(ethMint, ethUsdcMarket.publicKey, ethPythPrice.publicKey, ethPythProduct.publicKey);
    idl.metadata = {
        ...idl.metadata,
        serumProgramId: serum_1.DEX_ID.toBase58(),
        cluster,
        market: {
            market: market.publicKey.toBase58(),
            marketAuthority: marketAuthority.toBase58(),
        },
        reserves: [
            reserveAccountsMetadata(usdcReserveAccounts, "USDC", "USDC", usdcMint.decimals, 0),
            reserveAccountsMetadata(wsolReserveAccounts, "Solana", "SOL", wsolMint.decimals, 1),
            reserveAccountsMetadata(btcReserveAccounts, "Bitcoin", "BTC", btcMint.decimals, 2),
            reserveAccountsMetadata(ethReserveAccounts, "Ether", "ETH", ethMint.decimals, 3),
        ]
    };
    for (let i = 0; i < idl.metadata.reserves.length; i++) {
        (0, chai_1.assert)(i === idl.metadata.reserves[i].reserveIndex, "Reserve index does not match it's position in the array.");
    }
    console.log(`Writing reserve addresses to ${idlWebPath}...`);
    fs_1.default.mkdirSync(path_1.default.dirname(idlWebPath), { recursive: true });
    fs_1.default.writeFileSync(idlWebPath, JSON.stringify(idl, undefined, 2));
    console.log("Initializing usdc reserve...");
    await jetUtils.initReserve(usdcReserveAccounts, reserveConfig, market.publicKey, marketOwner, quoteTokenMint);
    console.log("Initializing wsol reserve...");
    await jetUtils.initReserve(wsolReserveAccounts, reserveConfig, market.publicKey, marketOwner, quoteTokenMint);
    console.log("Initializing btc reserve...");
    await jetUtils.initReserve(btcReserveAccounts, reserveConfig, market.publicKey, marketOwner, quoteTokenMint);
    console.log("Initializing eth reserve...");
    await jetUtils.initReserve(ethReserveAccounts, reserveConfig, market.publicKey, marketOwner, quoteTokenMint);
};
const reserveAccountsMetadata = (reserveAccounts, name, abbrev, decimals, reserveIndex) => {
    return {
        ...reserveAccounts,
        name,
        abbrev,
        decimals,
        reserveIndex,
        accounts: (0, utils_1.toBase58)({
            ...reserveAccounts.accounts,
            reserve: reserveAccounts.accounts.reserve.publicKey,
            tokenMint: reserveAccounts.accounts.tokenMint.publicKey,
            pythPrice: reserveAccounts.accounts.pythPrice,
            pythProduct: reserveAccounts.accounts.pythProduct,
            tokenSource: undefined,
            depositNoteDest: undefined, // users
        }),
        bump: {
            ...reserveAccounts.bump,
            depositNoteDest: undefined,
        }
    };
};
main();
//# sourceMappingURL=localnet-migrate.js.map