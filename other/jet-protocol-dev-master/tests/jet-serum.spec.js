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
const anchor = __importStar(require("@project-serum/anchor"));
const web3_js_1 = require("@solana/web3.js");
const utils_1 = require("./utils");
const jet_1 = require("./utils/jet");
const serum_1 = require("./utils/serum");
const jet_client_1 = require("@jet-lab/jet-client");
const bn_js_1 = __importDefault(require("bn.js"));
const spl_token_1 = require("@solana/spl-token");
const TEST_CURRENCY = "LTD";
describe("jet-serum", () => {
    let IDL;
    const program = anchor.workspace.Jet;
    const provider = anchor.Provider.local();
    const wallet = provider.wallet;
    const utils = new utils_1.TestUtils(provider.connection, wallet);
    const serum = new serum_1.SerumUtils(utils, false);
    const jetUtils = new jet_1.JetUtils(provider.connection, wallet, program, false);
    let jet;
    let client;
    let usdcToken;
    let jetMarket;
    let usdc;
    let wsol;
    let wbtc;
    let weth;
    let users;
    async function placeMarketOrders(market, bids, asks) {
        await market.marketMaker.placeOrders(market.dexMarket, bids, asks);
    }
    async function createAssetMarket(config) {
        const decimals = config.decimals ?? 9;
        const token = config.token ?? (await utils.createToken(decimals));
        const [dexMarket, marketMaker] = await createSerumMarket(token);
        const pythPrice = await utils.pyth.createPriceAccount();
        const pythProduct = await utils.pyth.createProductAccount();
        await utils.pyth.updatePriceAccount(pythPrice, config.pythPrice);
        await utils.pyth.updateProductAccount(pythProduct, {
            priceAccount: pythPrice.publicKey,
            attributes: {
                quote_currency: TEST_CURRENCY,
            },
        });
        const reserve = await jetMarket.createReserve({
            pythOraclePrice: pythPrice.publicKey,
            pythOracleProduct: pythProduct.publicKey,
            tokenMint: token.publicKey,
            config: config.reserveConfig,
            dexMarket: dexMarket?.publicKey ?? web3_js_1.PublicKey.default,
        });
        return {
            token,
            dexMarket,
            marketMaker,
            pythPrice,
            pythProduct,
            reserve,
        };
    }
    async function createSerumMarket(token) {
        const dexMarket = token == usdcToken
            ? Promise.resolve(null)
            : serum.createMarket({
                baseToken: token,
                quoteToken: usdcToken,
                baseLotSize: 1000000,
                quoteLotSize: 1000,
                feeRateBps: 1,
            });
        const dexMarketMaker = serum.createMarketMaker(10 * web3_js_1.LAMPORTS_PER_SOL, [
            [token, token.amount(1000000)],
            [usdcToken, usdcToken.amount(5000000)],
        ]);
        return Promise.all([dexMarket, dexMarketMaker]);
    }
    async function createUserTokens(user, asset, amount) {
        const tokenAccount = await asset.token.getOrCreateAssociatedAccountInfo(user);
        await asset.token.mintTo(tokenAccount.address, wallet.publicKey, [], amount);
        return tokenAccount.address;
    }
    async function createTestUser() {
        const userWallet = await utils.createWallet(100000 * web3_js_1.LAMPORTS_PER_SOL);
        const [_usdc, _wsol, _wbtc, _weth] = await Promise.all([
            createUserTokens(userWallet.publicKey, usdc, new spl_token_1.u64(10000 * web3_js_1.LAMPORTS_PER_SOL)),
            createUserTokens(userWallet.publicKey, wsol, new spl_token_1.u64(10000 * web3_js_1.LAMPORTS_PER_SOL)),
            createUserTokens(userWallet.publicKey, wbtc, new spl_token_1.u64(10000 * web3_js_1.LAMPORTS_PER_SOL)),
            createUserTokens(userWallet.publicKey, weth, new spl_token_1.u64(10000 * web3_js_1.LAMPORTS_PER_SOL)),
        ]);
        const userProgram = new anchor.Program(IDL, program.programId, new anchor.Provider(program.provider.connection, new anchor.Wallet(userWallet), {}));
        const userClient = new jet_client_1.JetClient(userProgram);
        return {
            wallet: userWallet,
            usdc: _usdc,
            wsol: _wsol,
            wbtc: _wbtc,
            weth: _weth,
            client: await jet_client_1.JetUser.load(userClient, jetMarket, userWallet.publicKey),
        };
    }
    before(async () => {
        IDL = program.idl;
        IDL.instructions.push(jet_1.LiquidateDexInstruction);
        jet = new anchor.Program(IDL, program.programId, provider);
        client = new jet_client_1.JetClient(jet);
        console.log(client.program.account.reserve.programId.toString());
        usdcToken = await utils.createToken(6);
        jetMarket = await client.createMarket({
            owner: wallet.publicKey,
            quoteCurrencyName: TEST_CURRENCY,
            quoteCurrencyMint: usdcToken.publicKey,
        });
        const createUsdc = createAssetMarket({
            token: usdcToken,
            pythPrice: {
                exponent: -9,
                aggregatePriceInfo: {
                    price: 1000000000n,
                },
            },
            reserveConfig: {
                utilizationRate1: 8500,
                utilizationRate2: 9500,
                borrowRate0: 50,
                borrowRate1: 392,
                borrowRate2: 3365,
                borrowRate3: 10116,
                minCollateralRatio: 12500,
                liquidationPremium: 100,
                manageFeeRate: 50,
                manageFeeCollectionThreshold: new bn_js_1.default(10),
                loanOriginationFee: 10,
                liquidationSlippage: 300,
                liquidationDexTradeMax: new bn_js_1.default(1000 * web3_js_1.LAMPORTS_PER_SOL),
            },
        });
        const createWsol = createAssetMarket({
            pythPrice: {
                exponent: -9,
                aggregatePriceInfo: {
                    price: 20n * 1000000000n,
                },
            },
            reserveConfig: {
                utilizationRate1: 8500,
                utilizationRate2: 9500,
                borrowRate0: 50,
                borrowRate1: 392,
                borrowRate2: 3365,
                borrowRate3: 10116,
                minCollateralRatio: 12500,
                liquidationPremium: 100,
                manageFeeRate: 50,
                manageFeeCollectionThreshold: new bn_js_1.default(10),
                loanOriginationFee: 10,
                liquidationSlippage: 300,
                liquidationDexTradeMax: new bn_js_1.default(1000 * web3_js_1.LAMPORTS_PER_SOL),
            },
        });
        const createWbtc = createAssetMarket({
            pythPrice: {
                exponent: -9,
                aggregatePriceInfo: {
                    price: 2000n * 1000000000n,
                },
            },
            reserveConfig: {
                utilizationRate1: 8500,
                utilizationRate2: 9500,
                borrowRate0: 50,
                borrowRate1: 392,
                borrowRate2: 3365,
                borrowRate3: 10116,
                minCollateralRatio: 12500,
                liquidationPremium: 100,
                manageFeeRate: 50,
                manageFeeCollectionThreshold: new bn_js_1.default(10),
                loanOriginationFee: 10,
                liquidationSlippage: 300,
                liquidationDexTradeMax: new bn_js_1.default(1000 * web3_js_1.LAMPORTS_PER_SOL),
            },
        });
        const createWeth = createAssetMarket({
            pythPrice: {
                exponent: -9,
                aggregatePriceInfo: {
                    price: 200n * 1000000000n,
                },
            },
            reserveConfig: {
                utilizationRate1: 8500,
                utilizationRate2: 9500,
                borrowRate0: 50,
                borrowRate1: 392,
                borrowRate2: 3365,
                borrowRate3: 10116,
                minCollateralRatio: 12500,
                liquidationPremium: 100,
                manageFeeRate: 50,
                manageFeeCollectionThreshold: new bn_js_1.default(10),
                loanOriginationFee: 10,
                liquidationSlippage: 300,
                liquidationDexTradeMax: new bn_js_1.default(1000 * web3_js_1.LAMPORTS_PER_SOL),
            },
        });
        [usdc, wsol, wbtc, weth] = await Promise.all([
            createUsdc,
            createWsol,
            createWbtc,
            createWeth,
        ]);
        users = await Promise.all(Array.from(Array(4).keys()).map(() => createTestUser()));
        await placeMarketOrders(wsol, serum_1.MarketMaker.makeOrders([[19.5, 100]]), serum_1.MarketMaker.makeOrders([[21.5, 100]]));
        await placeMarketOrders(wbtc, serum_1.MarketMaker.makeOrders([[999.5, 100]]), serum_1.MarketMaker.makeOrders([[1000.5, 100]]));
        await placeMarketOrders(weth, serum_1.MarketMaker.makeOrders([[200.08, 100]]), serum_1.MarketMaker.makeOrders([[199.04, 100]]));
    });
    it("user deposits", async () => {
        for (let i = 0; i < users.length; ++i) {
            const user = users[i];
            await Promise.all([
                user.client.deposit(usdc.reserve, user.usdc, jet_client_1.Amount.tokens(usdc.token.amount(10000))),
                user.client.deposit(wsol.reserve, user.wsol, jet_client_1.Amount.tokens(wsol.token.amount(10000))),
                user.client.deposit(weth.reserve, user.weth, jet_client_1.Amount.tokens(weth.token.amount(100))),
                user.client.deposit(wbtc.reserve, user.wbtc, jet_client_1.Amount.tokens(wbtc.token.amount(10))),
            ]);
        }
    });
    it("user borrows", async () => {
        await Promise.all([
            users[0].client.depositCollateral(usdc.reserve, jet_client_1.Amount.tokens(usdc.token.amount(1000))),
            users[1].client.depositCollateral(wsol.reserve, jet_client_1.Amount.tokens(wsol.token.amount(100))),
            users[2].client.depositCollateral(weth.reserve, jet_client_1.Amount.tokens(weth.token.amount(15))),
            users[3].client.depositCollateral(wbtc.reserve, jet_client_1.Amount.tokens(wbtc.token.amount(1))),
        ]);
        await Promise.all([
            users[0].client.borrow(wsol.reserve, users[0].wsol, jet_client_1.Amount.tokens(wsol.token.amount(10))),
            users[1].client.borrow(weth.reserve, users[1].weth, jet_client_1.Amount.tokens(weth.token.amount(1))),
            users[2].client.borrow(wbtc.reserve, users[2].wbtc, jet_client_1.Amount.tokens(wbtc.token.amount(1))),
            users[3].client.borrow(usdc.reserve, users[3].usdc, jet_client_1.Amount.tokens(usdc.token.amount(870))),
        ]);
    });
    it("allow basic dex liquidation", async () => {
        await utils.pyth.updatePriceAccount(wbtc.pythPrice, {
            exponent: -9,
            aggregatePriceInfo: {
                price: 1000n * 1000000000n,
            },
        });
        await users[3].client.liquidateDex(usdc.reserve, wbtc.reserve);
    });
    it("dex liquidation with 10 collaterals", async () => {
        const MAX_POSITIONS = 10;
        const user = await createTestUser();
        const lender = await createTestUser();
        const assets = await Promise.all(Array.from(Array(MAX_POSITIONS).keys()).map(async (i) => {
            return createAssetMarket({
                pythPrice: {
                    exponent: -9,
                    aggregatePriceInfo: {
                        price: (1000n + BigInt(i)) * 1000000000n,
                    },
                },
                reserveConfig: {
                    utilizationRate1: 8500,
                    utilizationRate2: 9500,
                    borrowRate0: 50,
                    borrowRate1: 392,
                    borrowRate2: 3365,
                    borrowRate3: 10116,
                    minCollateralRatio: 12500,
                    liquidationPremium: 100,
                    manageFeeRate: 50,
                    manageFeeCollectionThreshold: new bn_js_1.default(10),
                    loanOriginationFee: 10,
                    liquidationSlippage: 300,
                    liquidationDexTradeMax: new bn_js_1.default(1000 * web3_js_1.LAMPORTS_PER_SOL),
                },
            });
        }));
        const lenderTokenAccount = await createUserTokens(lender.wallet.publicKey, usdc, new spl_token_1.u64(1000000 * web3_js_1.LAMPORTS_PER_SOL));
        await lender.client.deposit(usdc.reserve, lenderTokenAccount, jet_client_1.Amount.tokens(usdc.token.amount(1000000)));
        const tokenAccounts = await Promise.all(assets.map((asset) => createUserTokens(user.wallet.publicKey, asset, new spl_token_1.u64(10000 * web3_js_1.LAMPORTS_PER_SOL))));
        await user.client.deposit(assets[0].reserve, tokenAccounts[0], jet_client_1.Amount.tokens(10));
        await user.client.depositCollateral(assets[0].reserve, jet_client_1.Amount.tokens(1));
        await Promise.all([
            assets.map((asset) => placeMarketOrders(asset, serum_1.MarketMaker.makeOrders([[119.5, 1000]]), serum_1.MarketMaker.makeOrders([[120.5, 1000]]))),
            assets.map(async (asset, i) => {
                await user.client.deposit(asset.reserve, tokenAccounts[i], jet_client_1.Amount.tokens(asset.token.amount(1)));
                await user.client.depositCollateral(asset.reserve, jet_client_1.Amount.tokens(asset.token.amount(1)));
            }),
        ].flat());
        await Promise.all(assets.map((asset) => asset.reserve.refresh()));
        await Promise.all([
            assets.map((asset) => asset.reserve.refresh()),
            user.client.borrow(usdc.reserve, lenderTokenAccount, jet_client_1.Amount.tokens(usdc.token.amount(1000))),
        ].flat());
        await Promise.all(assets.map((asset) => utils.pyth.updatePriceAccount(asset.pythPrice, {
            exponent: -9,
            aggregatePriceInfo: {
                price: 120n * 1000000000n,
            },
        })));
        await Promise.all(assets.map((asset) => asset.reserve.refresh()));
        await Promise.all([
            user.client.liquidateDex(usdc.reserve, assets[0].reserve),
            user.client.liquidateDex(usdc.reserve, assets[1].reserve),
            assets.map((asset) => asset.reserve.refresh()),
        ].flat());
    });
});
//# sourceMappingURL=jet-serum.spec.js.map