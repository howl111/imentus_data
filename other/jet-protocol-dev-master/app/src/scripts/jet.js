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
exports.getCustomProgramErrorCode = exports.getErrNameAndMsg = exports.airdrop = exports.repay = exports.borrow = exports.withdraw = exports.deposit = exports.addTransactionLog = exports.getLogDetails = exports.getTransactionsDetails = exports.initTransactionLogs = exports.getAssetPubkeys = exports.disconnectWallet = exports.getWalletAndAnchor = exports.getMarketAndIDL = exports.rollbar = exports.inDevelopment = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor = __importStar(require("@project-serum/anchor"));
const anchor_1 = require("@project-serum/anchor");
const spl_token_1 = require("@solana/spl-token");
const spl_token_2 = require("@solana/spl-token");
const rollbar_1 = __importDefault(require("rollbar"));
const walletAdapter_1 = __importDefault(require("./walletAdapter"));
const JetTypes_1 = require("../models/JetTypes");
const store_1 = require("../store");
const subscribe_1 = require("./subscribe");
const programUtil_1 = require("./programUtil");
const util_1 = require("./util");
const localization_1 = require("./localization");
const buffer_1 = require("buffer");
const SECONDS_PER_HOUR = new anchor_1.BN(3600);
const SECONDS_PER_DAY = SECONDS_PER_HOUR.muln(24);
const SECONDS_PER_WEEK = SECONDS_PER_DAY.muln(7);
const MAX_ACCRUAL_SECONDS = SECONDS_PER_WEEK;
const FAUCET_PROGRAM_ID = new web3_js_1.PublicKey("4bXpkKSV8swHSnwqtzuboGPaPDeEgAn4Vt8GfarV5rZt");
let program;
let market;
let user;
let idl;
let customProgramErrors;
let connection;
let transactionLogConnection;
let confirmedSignatures;
let currentSignaturesIndex = 0;
let coder;
store_1.PROGRAM.subscribe(data => program = data);
store_1.MARKET.subscribe(data => market = data);
store_1.USER.subscribe(data => user = data);
store_1.CUSTOM_PROGRAM_ERRORS.subscribe(data => customProgramErrors = data);
store_1.ANCHOR_WEB3_CONNECTION.subscribe(data => connection = data);
store_1.ANCHOR_CODER.subscribe(data => coder = data);
// Development / Devnet identifier
exports.inDevelopment = jetDev || window.location.hostname.indexOf('devnet') !== -1;
// Rollbar error logging
exports.rollbar = new rollbar_1.default({
    accessToken: 'e29773335de24e1f8178149992226c5e',
    captureUncaught: true,
    captureUnhandledRejections: true,
    payload: {
        environment: exports.inDevelopment ? 'devnet' : 'mainnet'
    }
});
// Get IDL and market data
const getMarketAndIDL = async () => {
    // Fetch IDL and preferred RPC Node
    const idlPath = "idl/" + jetIdl + "/jet.json";
    console.log(`Loading IDL from ${idlPath}`);
    const resp = await fetch(idlPath);
    idl = await resp.json();
    store_1.IDL_METADATA.set((0, programUtil_1.parseIdlMetadata)(idl.metadata));
    store_1.CUSTOM_PROGRAM_ERRORS.set(idl.errors);
    // Establish web3 connection
    const idlMetadata = (0, programUtil_1.parseIdlMetadata)(idl.metadata);
    coder = new anchor.Coder(idl);
    // Establish and test web3 connection
    // If error log it and display failure component
    const preferredNode = localStorage.getItem('jetPreferredNode');
    try {
        const anchorConnection = new anchor.web3.Connection(preferredNode ?? idlMetadata.cluster, (anchor.Provider.defaultOptions()).commitment);
        store_1.ANCHOR_WEB3_CONNECTION.set(anchorConnection);
        store_1.USER.update(user => {
            user.rpcNode = preferredNode;
            return user;
        });
    }
    catch {
        const anchorConnection = new anchor.web3.Connection(idlMetadata.cluster, (anchor.Provider.defaultOptions()).commitment);
        store_1.ANCHOR_WEB3_CONNECTION.set(anchorConnection);
        localStorage.removeItem('jetPreferredNode');
        store_1.USER.update(user => {
            user.rpcNode = null;
            return user;
        });
    }
    store_1.ANCHOR_CODER.set(new anchor.Coder(idl));
    try {
        await connection.getVersion();
    }
    catch (err) {
        console.error(`Unable to connect: ${err}`);
        exports.rollbar.critical(`Unable to connect: ${err}`);
        store_1.INIT_FAILED.set(true);
        return;
    }
    // Setup reserve structures
   const reserves = {};
    for (const reserveMeta of idlMetadata.reserves) {
        let reserve = {
            name: reserveMeta.name,
            abbrev: reserveMeta.abbrev,
            marketSize: util_1.TokenAmount.zero(reserveMeta.decimals),
            outstandingDebt: util_1.TokenAmount.zero(reserveMeta.decimals),
            utilizationRate: 0,
            depositRate: 0,
            borrowRate: 0,
            maximumLTV: 0,
            liquidationPremium: 0,
            price: 0,
            decimals: reserveMeta.decimals,
            depositNoteExchangeRate: new anchor_1.BN(0),
            loanNoteExchangeRate: new anchor_1.BN(0),
            accruedUntil: new anchor_1.BN(0),
            config: {
                utilizationRate1: 0,
                utilizationRate2: 0,
                borrowRate0: 0,
                borrowRate1: 0,
                borrowRate2: 0,
                borrowRate3: 0,
                minCollateralRatio: 0,
                liquidationPremium: 0,
                manageFeeCollectionThreshold: new anchor_1.BN(0),
                manageFeeRate: 0,
                loanOriginationFee: 0,
                liquidationSlippage: 0,
                _reserved0: 0,
                liquidationDexTradeMax: 0,
                _reserved1: [],
            },
            accountPubkey: reserveMeta.accounts.reserve,
            vaultPubkey: reserveMeta.accounts.vault,
            availableLiquidity: util_1.TokenAmount.zero(reserveMeta.decimals),
            feeNoteVaultPubkey: reserveMeta.accounts.feeNoteVault,
            tokenMintPubkey: reserveMeta.accounts.tokenMint,
            tokenMint: util_1.TokenAmount.zero(reserveMeta.decimals),
            faucetPubkey: reserveMeta.accounts.faucet ?? null,
            depositNoteMintPubkey: reserveMeta.accounts.depositNoteMint,
            depositNoteMint: util_1.TokenAmount.zero(reserveMeta.decimals),
            loanNoteMintPubkey: reserveMeta.accounts.loanNoteMint,
            loanNoteMint: util_1.TokenAmount.zero(reserveMeta.decimals),
            pythPricePubkey: reserveMeta.accounts.pythPrice,
            pythProductPubkey: reserveMeta.accounts.pythProduct,
        };
        reserves[reserveMeta.abbrev] = reserve;
    }
    // Update market accounts and reserves
    store_1.MARKET.update(market => {
        market.accountPubkey = idlMetadata.market.market;
        market.authorityPubkey = idlMetadata.market.marketAuthority;
        market.reserves = reserves;
        market.currentReserve = reserves.SOL;
        return market;
    });
    // Subscribe to market 
    await (0, subscribe_1.subscribeToMarket)(idlMetadata, connection, coder);
};
exports.getMarketAndIDL = getMarketAndIDL;
// Connect to user's wallet
const getWalletAndAnchor = async (provider) => {
    // Cast solana injected window type
    const solWindow = window;
    let wallet;
    // Wallet adapter or injected wallet setup
    if (provider.name === 'Phantom' && solWindow.solana?.isPhantom) {
        wallet = solWindow.solana;
    }
    else if (provider.name === 'Solflare' && solWindow.solflare?.isSolflare) {
        wallet = solWindow.solflare;
    }
    else if (provider.name === 'Slope' && !!solWindow.Slope) {
        wallet = new solWindow.Slope();
        const { data } = await wallet.connect();
        if (data.publicKey) {
            wallet.publicKey = new anchor.web3.PublicKey(data.publicKey);
        }
        wallet.on = (action, callback) => { if (callback)
            callback(); };
    }
    else if (provider.name === 'Math Wallet' && solWindow.solana?.isMathWallet) {
        wallet = solWindow.solana;
        wallet.publicKey = new anchor.web3.PublicKey(await solWindow.solana.getAccount());
        wallet.on = (action, callback) => { if (callback)
            callback(); };
        wallet.connect = (action, callback) => { if (callback)
            callback(); };
    }
    else if (provider.name === 'Solong' && solWindow.solong) {
        wallet = solWindow.solong;
        wallet.publicKey = new anchor.web3.PublicKey(await solWindow.solong.selectAccount());
        wallet.on = (action, callback) => { if (callback)
            callback(); };
        wallet.connect = (action, callback) => { if (callback)
            callback(); };
    }
    else {
        wallet = new walletAdapter_1.default(provider.url);
    }
    ;
    // Setup anchor program
    anchor.setProvider(new anchor.Provider(connection, wallet, anchor.Provider.defaultOptions()));
    program = new anchor.Program(idl, (new anchor.web3.PublicKey(idl.metadata.address)));
    store_1.PROGRAM.set(program);
    // Set up wallet connection
    wallet.name = provider.name;
    wallet.on('connect', async () => {
        //Set wallet object on user
        store_1.USER.update(user => {
            user.wallet = wallet;
            return user;
        });
        // Begin fetching transaction logs
        (0, exports.initTransactionLogs)();
        // Get all asset pubkeys owned by wallet pubkey
        await (0, exports.getAssetPubkeys)();
        // Subscribe to all asset accounts for those pubkeys
        await (0, subscribe_1.subscribeToAssets)(connection, coder, wallet.publicKey);
        // Init wallet for UI display
        store_1.USER.update(user => {
            user.walletInit = true;
            return user;
        });
    });
    // Initiate wallet connection
    try {
        await wallet.connect();
    }
    catch (err) {
        console.error(err);
    }
    // User must accept disclaimer upon mainnet launch
    if (!exports.inDevelopment) {
        const accepted = localStorage.getItem('jetDisclaimer');
        if (!accepted) {
            store_1.COPILOT.set({
                alert: {
                    good: false,
                    header: localization_1.dictionary[user.language].copilot.alert.warning,
                    text: localization_1.dictionary[user.language].copilot.alert.disclaimer,
                    action: {
                        text: localization_1.dictionary[user.language].copilot.alert.accept,
                        onClick: () => localStorage.setItem('jetDisclaimer', 'true')
                    }
                }
            });
        }
    }
};
exports.getWalletAndAnchor = getWalletAndAnchor;
// Disconnect user wallet
const disconnectWallet = () => {
    if (user.wallet?.disconnect) {
        user.wallet.disconnect();
    }
    if (user.wallet?.forgetAccounts) {
        user.wallet.forgetAccounts();
    }
    store_1.USER.update(user => {
        user.wallet = null;
        user.walletInit = false;
        user.assets = null;
        user.walletBalances = {};
        user.collateralBalances = {};
        user.loanBalances = {};
        user.position = {
            depositedValue: 0,
            borrowedValue: 0,
            colRatio: 0,
            utilizationRate: 0
        };
        user.transactionLogs = [];
        return user;
    });
};
exports.disconnectWallet = disconnectWallet;
// Get user token accounts
const getAssetPubkeys = async () => {
    if (program == null || user.wallet === null) {
        return;
    }
    let [obligationPubkey, obligationBump] = await (0, programUtil_1.findObligationAddress)(program, market.accountPubkey, user.wallet.publicKey);
    let assetStore = {
        sol: new util_1.TokenAmount(new anchor_1.BN(0), programUtil_1.SOL_DECIMALS),
        obligationPubkey,
        obligationBump,
        tokens: {}
    };
    for (const assetAbbrev in market.reserves) {
        let reserve = market.reserves[assetAbbrev];
        let tokenMintPubkey = reserve.tokenMintPubkey;
        let [depositNoteDestPubkey, depositNoteDestBump] = await (0, programUtil_1.findDepositNoteDestAddress)(program, reserve.accountPubkey, user.wallet.publicKey);
        let [depositNotePubkey, depositNoteBump] = await (0, programUtil_1.findDepositNoteAddress)(program, reserve.accountPubkey, user.wallet.publicKey);
        let [loanNotePubkey, loanNoteBump] = await (0, programUtil_1.findLoanNoteAddress)(program, reserve.accountPubkey, obligationPubkey, user.wallet.publicKey);
        let [collateralPubkey, collateralBump] = await (0, programUtil_1.findCollateralAddress)(program, reserve.accountPubkey, obligationPubkey, user.wallet.publicKey);
        let asset = {
            tokenMintPubkey,
            walletTokenPubkey: await spl_token_2.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_2.TOKEN_PROGRAM_ID, tokenMintPubkey, user.wallet.publicKey),
            walletTokenExists: false,
            walletTokenBalance: util_1.TokenAmount.zero(reserve.decimals),
            depositNotePubkey,
            depositNoteBump,
            depositNoteExists: false,
            depositNoteBalance: util_1.TokenAmount.zero(reserve.decimals),
            depositBalance: util_1.TokenAmount.zero(reserve.decimals),
            depositNoteDestPubkey,
            depositNoteDestBump,
            depositNoteDestExists: false,
            depositNoteDestBalance: util_1.TokenAmount.zero(reserve.decimals),
            loanNotePubkey,
            loanNoteBump,
            loanNoteExists: false,
            loanNoteBalance: util_1.TokenAmount.zero(reserve.decimals),
            loanBalance: util_1.TokenAmount.zero(reserve.decimals),
            collateralNotePubkey: collateralPubkey,
            collateralNoteBump: collateralBump,
            collateralNoteExists: false,
            collateralNoteBalance: util_1.TokenAmount.zero(reserve.decimals),
            collateralBalance: util_1.TokenAmount.zero(reserve.decimals),
            maxDepositAmount: 0,
            maxWithdrawAmount: 0,
            maxBorrowAmount: 0,
            maxRepayAmount: 0
        };
        // Set user assets
        assetStore.tokens[assetAbbrev] = asset;
        store_1.USER.update(user => {
            user.assets = assetStore;
            return user;
        });
    }
};
exports.getAssetPubkeys = getAssetPubkeys;
// Get all confirmed signatures for wallet pubkey
// TODO: call this again when user changes rpc node
const initTransactionLogs = async () => {
    if (!user.wallet) {
        return;
    }
    // Set up connection
    transactionLogConnection = user.rpcNode ? new anchor.web3.Connection(user.rpcNode)
        : (exports.inDevelopment
            ? new anchor.web3.Connection('https://api.devnet.solana.com/')
            : new anchor.web3.Connection('https://api.devnet.solana.com/'));
    // Fetch all confirmed signatures
    confirmedSignatures = await transactionLogConnection.getConfirmedSignaturesForAddress2(user.wallet.publicKey, undefined, 'confirmed');
    // Get first 16 full detailed logs
    await (0, exports.getTransactionsDetails)(16);
};
exports.initTransactionLogs = initTransactionLogs;
// Get transaction details from confirmed signatures
const getTransactionsDetails = async (txAmount) => {
    // Begin loading transaction logs
    store_1.USER.update(user => {
        user.transactionLogsInit = false;
        return user;
    });
    // Iterate until get the last signature or add the amount of tx we called for
    let logsCount = 0;
    let newLogs = [];
    while (currentSignaturesIndex < confirmedSignatures.length && logsCount < txAmount) {
        // Get current signature from index
        const currentSignature = confirmedSignatures[currentSignaturesIndex]?.signature;
        if (!currentSignature) {
            return;
        }
        // Get confirmed transaction for signature
        const log = await transactionLogConnection.getConfirmedTransaction(currentSignature, 'confirmed');
        const detailedLog = log ? await (0, exports.getLogDetails)(log, currentSignature) : null;
        if (detailedLog) {
            newLogs.push(detailedLog);
            logsCount++;
        }
        // Increment current index
        currentSignaturesIndex++;
    }
    // Add transaction logs and stop loading
    store_1.USER.update(user => {
        user.transactionLogs = [...user.transactionLogs, ...newLogs];
        user.transactionLogsInit = true;
        return user;
    });
};
exports.getTransactionsDetails = getTransactionsDetails;
// Get UI data of a transaction log
let getLogDetails = async (log, signature) => {
    // Record of instructions to their first 8 bytes for transaction logs
    const instructionBytes = {
        deposit: [242, 35, 198, 137, 82, 225, 242, 182],
        withdraw: [183, 18, 70, 156, 148, 109, 161, 34],
        borrow: [228, 253, 131, 202, 207, 116, 89, 18],
        repay: [234, 103, 67, 82, 208, 234, 219, 166]
    };
    // Use log messages to only surface transactions that utilize Jet
    for (let msg of log.meta.logMessages) {
        if (msg.indexOf(idl.metadata.address) !== -1) {
            for (let progInst in instructionBytes) {
                for (let inst of log.transaction.instructions) {
                    // Get first 8 bytes from data
                    const txInstBytes = [];
                    for (let i = 0; i < 8; i++) {
                        txInstBytes.push(inst.data[i]);
                    }
                    // If those bytes match any of our instructions label trade action
                    if (JSON.stringify(instructionBytes[progInst]) === JSON.stringify(txInstBytes)) {
                        log.tradeAction = localization_1.dictionary[user.language].transactions[progInst];
                        // Determine asset and trade amount
                        for (let pre of log.meta.preTokenBalances) {
                            for (let post of log.meta.postTokenBalances) {
                                if (pre.mint === post.mint && pre.uiTokenAmount.amount !== post.uiTokenAmount.amount) {
                                    for (let reserve of idl.metadata.reserves) {
                                        if (reserve.accounts.tokenMint === pre.mint) {
                                            // For withdraw and borrow SOL,
                                            // Skip last account (pre-token balance is 0)
                                            if (reserve.abbrev === 'SOL'
                                                && (progInst === 'withdraw' || progInst === 'borrow')
                                                && pre.uiTokenAmount.amount === '0') {
                                                break;
                                            }
                                            log.tokenAbbrev = reserve.abbrev;
                                            log.tokenDecimals = reserve.decimals;
                                            log.tokenPrice = reserve.price;
                                            log.tradeAmount = new util_1.TokenAmount(new anchor_1.BN(post.uiTokenAmount.amount - pre.uiTokenAmount.amount), reserve.decimals);
                                        }
                                    }
                                }
                            }
                        }
                        // Signature
                        log.signature = signature;
                        // UI date
                        log.blockDate = new Date(log.blockTime * 1000).toLocaleDateString();
                        // Explorer URL
                        log.explorerUrl = (0, programUtil_1.explorerUrl)(log.signature);
                        // If we found mint match, add tx to logs
                        if (log.tokenAbbrev) {
                            return log;
                        }
                    }
                }
            }
        }
    }
};
exports.getLogDetails = getLogDetails;
// Add new transaction log on trade submit
let addTransactionLog = async (signature) => {
    const txLogs = user.transactionLogs ?? [];
    //Reset logs for load
    store_1.USER.update(user => {
        user.transactionLogsInit = false;
        return user;
    });
    // Keep trying to get confirmed log (may take a few seconds for validation)
    let log = null;
    while (!log) {
        log = await transactionLogConnection.getConfirmedTransaction(signature, 'confirmed');
        (0, util_1.timeout)(2000);
    }
    // Get UI details and add to logs store
    const logDetail = await (0, exports.getLogDetails)(log, signature);
    if (logDetail) {
        txLogs.unshift(logDetail);
        store_1.USER.update(user => {
            user.transactionLogs = txLogs;
            user.transactionLogsInit = true;
            return user;
        });
    }
};
exports.addTransactionLog = addTransactionLog;
// Deposit
const deposit = async (abbrev, lamports) => {
    if (!user.assets || !user.wallet || !program) {
        return [JetTypes_1.TxnResponse.Failed, null];
    }
    const [ok, txid] = await refreshOldReserves();
    if (!ok) {
        return [JetTypes_1.TxnResponse.Failed, txid];
    }
    let reserve = market.reserves[abbrev];
    let asset = user.assets.tokens[abbrev];
    let depositSourcePubkey = asset.walletTokenPubkey;
    // Optional signers
    let depositSourceKeypair;
    // Optional instructions
    // Create wrapped sol ixs
    let createTokenAccountIx;
    let initTokenAccountIx;
    let closeTokenAccountIx;
    // Initialize Obligation, deposit notes, collateral notes
    let initObligationIx;
    let initDepositAccountIx;
    let initCollateralAccountIx;
    // When handling SOL, ignore existing wsol accounts and initialize a new wrapped sol account
    if (asset.tokenMintPubkey.equals(spl_token_1.NATIVE_MINT)) {
        // Overwrite the deposit source
        // The app will always wrap native sol, ignoring any existing wsol
        depositSourceKeypair = web3_js_1.Keypair.generate();
        depositSourcePubkey = depositSourceKeypair.publicKey;
        const rent = await connection.getMinimumBalanceForRentExemption(spl_token_2.AccountLayout.span);
        createTokenAccountIx = web3_js_1.SystemProgram.createAccount({
            fromPubkey: user.wallet.publicKey,
            newAccountPubkey: depositSourcePubkey,
            programId: spl_token_2.TOKEN_PROGRAM_ID,
            space: spl_token_2.AccountLayout.span,
            lamports: parseInt(lamports.addn(rent).toString())
        });
        initTokenAccountIx = spl_token_2.Token.createInitAccountInstruction(spl_token_2.TOKEN_PROGRAM_ID, spl_token_1.NATIVE_MINT, depositSourcePubkey, user.wallet.publicKey);
        closeTokenAccountIx = spl_token_2.Token.createCloseAccountInstruction(spl_token_2.TOKEN_PROGRAM_ID, depositSourcePubkey, user.wallet.publicKey, user.wallet.publicKey, []);
    }
    // Create the deposit note dest account if it doesn't exist
    if (!asset.depositNoteExists) {
        initDepositAccountIx = program.instruction.initDepositAccount(asset.depositNoteBump, {
            accounts: {
                market: market.accountPubkey,
                marketAuthority: market.authorityPubkey,
                reserve: reserve.accountPubkey,
                depositNoteMint: reserve.depositNoteMintPubkey,
                depositor: user.wallet.publicKey,
                depositAccount: asset.depositNotePubkey,
                tokenProgram: spl_token_2.TOKEN_PROGRAM_ID,
                systemProgram: web3_js_1.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            },
        });
    }
    if (!user.assets.obligation) {
        initObligationIx = buildInitObligationIx();
    }
    // Obligatory refresh instruction
    const refreshReserveIx = buildRefreshReserveIx(abbrev);
    const amount = util_1.Amount.tokens(lamports);
    const depositIx = program.instruction.deposit(asset.depositNoteBump, amount, {
        accounts: {
            market: market.accountPubkey,
            marketAuthority: market.authorityPubkey,
            reserve: reserve.accountPubkey,
            vault: reserve.vaultPubkey,
            depositNoteMint: reserve.depositNoteMintPubkey,
            depositor: user.wallet.publicKey,
            depositAccount: asset.depositNotePubkey,
            depositSource: depositSourcePubkey,
            tokenProgram: spl_token_2.TOKEN_PROGRAM_ID,
        }
    });
    // Initialize the collateral account if it doesn't exist
    if (!asset.collateralNoteExists) {
        initCollateralAccountIx = program.instruction.initCollateralAccount(asset.collateralNoteBump, {
            accounts: {
                market: market.accountPubkey,
                marketAuthority: market.authorityPubkey,
                obligation: user.assets.obligationPubkey,
                reserve: reserve.accountPubkey,
                depositNoteMint: reserve.depositNoteMintPubkey,
                owner: user.wallet.publicKey,
                collateralAccount: asset.collateralNotePubkey,
                tokenProgram: spl_token_2.TOKEN_PROGRAM_ID,
                systemProgram: web3_js_1.SystemProgram.programId,
                rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            }
        });
    }
    const depositCollateralBumpSeeds = {
        collateralAccount: asset.collateralNoteBump,
        depositAccount: asset.depositNoteBump,
    };
    let depositCollateralIx = program.instruction.depositCollateral(depositCollateralBumpSeeds, amount, {
        accounts: {
            market: market.accountPubkey,
            marketAuthority: market.authorityPubkey,
            reserve: reserve.accountPubkey,
            obligation: user.assets.obligationPubkey,
            owner: user.wallet.publicKey,
            depositAccount: asset.depositNotePubkey,
            collateralAccount: asset.collateralNotePubkey,
            tokenProgram: spl_token_2.TOKEN_PROGRAM_ID,
        }
    });
    const ix = [
        createTokenAccountIx,
        initTokenAccountIx,
        initDepositAccountIx,
        initObligationIx,
        initCollateralAccountIx,
        refreshReserveIx,
        depositIx,
        depositCollateralIx,
        closeTokenAccountIx
    ].filter(ix => ix);
    const signers = [depositSourceKeypair].filter(signer => signer);
    try {
        return await (0, programUtil_1.sendTransaction)(program.provider, ix, signers);
    }
    catch (err) {
        console.error(`Deposit error: ${(0, programUtil_1.transactionErrorToString)(err)}`);
        exports.rollbar.error(`Deposit error: ${(0, programUtil_1.transactionErrorToString)(err)}`);
        return [JetTypes_1.TxnResponse.Failed, null];
    }
};
exports.deposit = deposit;
// Withdraw
const withdraw = async (abbrev, amount) => {
    if (!user.assets || !user.wallet || !program) {
        return [JetTypes_1.TxnResponse.Failed, null];
    }
    const [ok, txid] = await refreshOldReserves();
    if (!ok) {
        return [JetTypes_1.TxnResponse.Failed, txid];
    }
    const reserve = market.reserves[abbrev];
    const asset = user.assets.tokens[abbrev];
    let withdrawAccount = asset.walletTokenPubkey;
    // Create token account ix
    let createAssociatedTokenAccountIx;
    // Wrapped sol ixs
    let wsolKeypair;
    let createWsolIx;
    let initWsolIx;
    let closeWsolIx;
    if (asset.tokenMintPubkey.equals(spl_token_1.NATIVE_MINT)) {
        // Create a token account to receive wrapped sol.
        // There isn't an easy way to unwrap sol without
        // closing the account, so we avoid closing the 
        // associated token account.
        const rent = await spl_token_2.Token.getMinBalanceRentForExemptAccount(connection);
        wsolKeypair = web3_js_1.Keypair.generate();
        withdrawAccount = wsolKeypair.publicKey;
        createWsolIx = web3_js_1.SystemProgram.createAccount({
            fromPubkey: user.wallet.publicKey,
            newAccountPubkey: withdrawAccount,
            programId: spl_token_2.TOKEN_PROGRAM_ID,
            space: spl_token_2.AccountLayout.span,
            lamports: rent,
        });
        initWsolIx = spl_token_2.Token.createInitAccountInstruction(spl_token_2.TOKEN_PROGRAM_ID, reserve.tokenMintPubkey, withdrawAccount, user.wallet.publicKey);
    }
    else if (!asset.walletTokenExists) {
        // Create the wallet token account if it doesn't exist
        createAssociatedTokenAccountIx = spl_token_2.Token.createAssociatedTokenAccountInstruction(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_2.TOKEN_PROGRAM_ID, asset.tokenMintPubkey, withdrawAccount, user.wallet.publicKey, user.wallet.publicKey);
    }
    // Obligatory refresh instruction
    const refreshReserveIxs = buildRefreshReserveIxs();
    const withdrawCollateralBumps = {
        collateralAccount: asset.collateralNoteBump,
        depositAccount: asset.depositNoteBump,
    };
    const withdrawCollateralIx = program.instruction.withdrawCollateral(withdrawCollateralBumps, amount, {
        accounts: {
            market: market.accountPubkey,
            marketAuthority: market.authorityPubkey,
            reserve: reserve.accountPubkey,
            obligation: user.assets.obligationPubkey,
            owner: user.wallet.publicKey,
            depositAccount: asset.depositNotePubkey,
            collateralAccount: asset.collateralNotePubkey,
            tokenProgram: spl_token_2.TOKEN_PROGRAM_ID,
        },
    });
    const withdrawIx = program.instruction.withdraw(asset.depositNoteBump, amount, {
        accounts: {
            market: market.accountPubkey,
            marketAuthority: market.authorityPubkey,
            reserve: reserve.accountPubkey,
            vault: reserve.vaultPubkey,
            depositNoteMint: reserve.depositNoteMintPubkey,
            depositor: user.wallet.publicKey,
            depositAccount: asset.depositNotePubkey,
            withdrawAccount,
            tokenProgram: spl_token_2.TOKEN_PROGRAM_ID,
        },
    });
    // Unwrap sol
    if (asset.tokenMintPubkey.equals(spl_token_1.NATIVE_MINT) && wsolKeypair) {
        closeWsolIx = spl_token_2.Token.createCloseAccountInstruction(spl_token_2.TOKEN_PROGRAM_ID, withdrawAccount, user.wallet.publicKey, user.wallet.publicKey, []);
    }
    const ixs = [
        {
            ix: [
                createAssociatedTokenAccountIx,
                createWsolIx,
                initWsolIx,
            ].filter(ix => ix),
            signers: [wsolKeypair].filter(signer => signer),
        },
        {
            ix: [
                ...refreshReserveIxs,
                withdrawCollateralIx,
                withdrawIx,
                closeWsolIx,
            ].filter(ix => ix),
        }
    ];
    try {
        const [ok, txids] = await (0, programUtil_1.sendAllTransactions)(program.provider, ixs);
        return [ok, txids[txids.length - 1]];
    }
    catch (err) {
        console.error(`Withdraw error: ${(0, programUtil_1.transactionErrorToString)(err)}`);
        exports.rollbar.error(`Withdraw error: ${(0, programUtil_1.transactionErrorToString)(err)}`);
        return [JetTypes_1.TxnResponse.Failed, null];
    }
};
exports.withdraw = withdraw;
// Borrow
const borrow = async (abbrev, amount) => {
    if (!user.assets || !user.wallet || !program) {
        return [JetTypes_1.TxnResponse.Failed, null];
    }
    const [ok, txid] = await refreshOldReserves();
    if (!ok) {
        return [JetTypes_1.TxnResponse.Failed, txid];
    }
    const reserve = market.reserves[abbrev];
    const asset = user.assets.tokens[abbrev];
    let receiverAccount = asset.walletTokenPubkey;
    // Create token account ix
    let createTokenAccountIx;
    // Create loan note token ix
    let initLoanAccountIx;
    // Wrapped sol ixs
    let wsolKeypair;
    let createWsolTokenAccountIx;
    let initWsoltokenAccountIx;
    let closeTokenAccountIx;
    if (asset.tokenMintPubkey.equals(spl_token_1.NATIVE_MINT)) {
        // Create a token account to receive wrapped sol.
        // There isn't an easy way to unwrap sol without
        // closing the account, so we avoid closing the 
        // associated token account.
        const rent = await spl_token_2.Token.getMinBalanceRentForExemptAccount(connection);
        wsolKeypair = web3_js_1.Keypair.generate();
        receiverAccount = wsolKeypair.publicKey;
        createWsolTokenAccountIx = web3_js_1.SystemProgram.createAccount({
            fromPubkey: user.wallet.publicKey,
            newAccountPubkey: wsolKeypair.publicKey,
            programId: spl_token_2.TOKEN_PROGRAM_ID,
            space: spl_token_2.AccountLayout.span,
            lamports: rent,
        });
        initWsoltokenAccountIx = spl_token_2.Token.createInitAccountInstruction(spl_token_2.TOKEN_PROGRAM_ID, reserve.tokenMintPubkey, wsolKeypair.publicKey, user.wallet.publicKey);
    }
    else if (!asset.walletTokenExists) {
        // Create the wallet token account if it doesn't exist
        createTokenAccountIx = spl_token_2.Token.createAssociatedTokenAccountInstruction(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_2.TOKEN_PROGRAM_ID, asset.tokenMintPubkey, asset.walletTokenPubkey, user.wallet.publicKey, user.wallet.publicKey);
    }
    // Create the loan note account if it doesn't exist
    if (!asset.loanNoteExists) {
        initLoanAccountIx = program.instruction.initLoanAccount(asset.loanNoteBump, {
            accounts: {
                market: market.accountPubkey,
                marketAuthority: market.authorityPubkey,
                obligation: user.assets.obligationPubkey,
                reserve: reserve.accountPubkey,
                loanNoteMint: reserve.loanNoteMintPubkey,
                owner: user.wallet.publicKey,
                loanAccount: asset.loanNotePubkey,
                tokenProgram: spl_token_2.TOKEN_PROGRAM_ID,
                systemProgram: web3_js_1.SystemProgram.programId,
                rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            }
        });
    }
    // Obligatory refresh instruction
    const refreshReserveIxs = buildRefreshReserveIxs();
    const borrowIx = program.instruction.borrow(asset.loanNoteBump, amount, {
        accounts: {
            market: market.accountPubkey,
            marketAuthority: market.authorityPubkey,
            obligation: user.assets.obligationPubkey,
            reserve: reserve.accountPubkey,
            vault: reserve.vaultPubkey,
            loanNoteMint: reserve.loanNoteMintPubkey,
            borrower: user.wallet.publicKey,
            loanAccount: asset.loanNotePubkey,
            receiverAccount,
            tokenProgram: spl_token_2.TOKEN_PROGRAM_ID,
        },
    });
    // If withdrawing SOL, unwrap it by closing
    if (asset.tokenMintPubkey.equals(spl_token_1.NATIVE_MINT)) {
        closeTokenAccountIx = spl_token_2.Token.createCloseAccountInstruction(spl_token_2.TOKEN_PROGRAM_ID, receiverAccount, user.wallet.publicKey, user.wallet.publicKey, []);
    }
    const ixs = [
        {
            ix: [
                createTokenAccountIx,
                createWsolTokenAccountIx,
                initWsoltokenAccountIx,
                initLoanAccountIx,
            ].filter(ix => ix),
            signers: [wsolKeypair].filter(ix => ix),
        },
        {
            ix: [
                ...refreshReserveIxs,
                borrowIx,
                closeTokenAccountIx
            ].filter(ix => ix),
        }
    ];
    try {
        // Make deposit RPC call
        const [ok, txids] = await (0, programUtil_1.sendAllTransactions)(program.provider, ixs);
        return [ok, txids[txids.length - 1]];
    }
    catch (err) {
        console.error(`Borrow error: ${(0, programUtil_1.transactionErrorToString)(err)}`);
        exports.rollbar.error(`Borrow error: ${(0, programUtil_1.transactionErrorToString)(err)}`);
        return [JetTypes_1.TxnResponse.Failed, null];
    }
};
exports.borrow = borrow;
// Repay
const repay = async (abbrev, amount) => {
    if (!user.assets || !user.wallet || !program) {
        return [JetTypes_1.TxnResponse.Failed, null];
    }
    const [ok, txid] = await refreshOldReserves();
    if (!ok) {
        return [JetTypes_1.TxnResponse.Failed, txid];
    }
    const reserve = market.reserves[abbrev];
    const asset = user.assets.tokens[abbrev];
    let depositSourcePubkey = asset.walletTokenPubkey;
    // Optional signers
    let depositSourceKeypair;
    // Optional instructions
    // Create wrapped sol ixs
    let createTokenAccountIx;
    let initTokenAccountIx;
    let closeTokenAccountIx;
    // When handling SOL, ignore existing wsol accounts and initialize a new wrapped sol account
    if (asset.tokenMintPubkey.equals(spl_token_1.NATIVE_MINT)) {
        // Overwrite the deposit source
        // The app will always wrap native sol, ignoring any existing wsol
        depositSourceKeypair = web3_js_1.Keypair.generate();
        depositSourcePubkey = depositSourceKeypair.publicKey;
        // Do our best to estimate the lamports we need
        // 1.002 is a bit of room for interest
        const lamports = amount.units.loanNotes
            ? reserve.loanNoteExchangeRate.mul(amount.value).div(new anchor_1.BN(Math.pow(10, 15))).muln(1.002)
            : amount.value;
        const rent = await connection.getMinimumBalanceForRentExemption(spl_token_2.AccountLayout.span);
        createTokenAccountIx = web3_js_1.SystemProgram.createAccount({
            fromPubkey: user.wallet.publicKey,
            newAccountPubkey: depositSourcePubkey,
            programId: spl_token_2.TOKEN_PROGRAM_ID,
            space: spl_token_2.AccountLayout.span,
            lamports: parseInt(lamports.addn(rent).toString())
        });
        initTokenAccountIx = spl_token_2.Token.createInitAccountInstruction(spl_token_2.TOKEN_PROGRAM_ID, spl_token_1.NATIVE_MINT, depositSourcePubkey, user.wallet.publicKey);
        closeTokenAccountIx = spl_token_2.Token.createCloseAccountInstruction(spl_token_2.TOKEN_PROGRAM_ID, depositSourcePubkey, user.wallet.publicKey, user.wallet.publicKey, []);
    }
    else if (!asset.walletTokenExists) {
        return [JetTypes_1.TxnResponse.Failed, null];
    }
    // Obligatory refresh instruction
    const refreshReserveIx = buildRefreshReserveIx(abbrev);
    const repayIx = program.instruction.repay(amount, {
        accounts: {
            market: market.accountPubkey,
            marketAuthority: market.authorityPubkey,
            obligation: user.assets.obligationPubkey,
            reserve: reserve.accountPubkey,
            vault: reserve.vaultPubkey,
            loanNoteMint: reserve.loanNoteMintPubkey,
            payer: user.wallet.publicKey,
            loanAccount: asset.loanNotePubkey,
            payerAccount: depositSourcePubkey,
            tokenProgram: spl_token_2.TOKEN_PROGRAM_ID,
        },
    });
    const ix = [
        createTokenAccountIx,
        initTokenAccountIx,
        refreshReserveIx,
        repayIx,
        closeTokenAccountIx,
    ].filter(ix => ix);
    const signers = [depositSourceKeypair].filter(signer => signer);
    try {
        return await (0, programUtil_1.sendTransaction)(program.provider, ix, signers);
    }
    catch (err) {
        console.error(`Repay error: ${(0, programUtil_1.transactionErrorToString)(err)}`);
        exports.rollbar.error(`Repay error: ${(0, programUtil_1.transactionErrorToString)(err)}`);
        return [JetTypes_1.TxnResponse.Failed, null];
    }
};
exports.repay = repay;
const buildInitObligationIx = () => {
    if (!program || !user.assets || !user.wallet) {
        return;
    }
    return program.instruction.initObligation(user.assets.obligationBump, {
        accounts: {
            market: market.accountPubkey,
            marketAuthority: market.authorityPubkey,
            borrower: user.wallet.publicKey,
            obligation: user.assets.obligationPubkey,
            tokenProgram: spl_token_2.TOKEN_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
        },
    });
};
/** Creates ixs to refresh all reserves. */
const buildRefreshReserveIxs = () => {
    const ix = [];
    if (!user.assets) {
        return ix;
    }
    for (const assetAbbrev in user.assets.tokens) {
        const refreshReserveIx = buildRefreshReserveIx(assetAbbrev);
        ix.push(refreshReserveIx);
    }
    return ix;
};
/**Sends transactions to refresh all reserves
 * until it can be fully refreshed once more. */
const refreshOldReserves = async () => {
    if (!program) {
        return [JetTypes_1.TxnResponse.Failed, null];
    }
    let result = [JetTypes_1.TxnResponse.Success, null];
    for (const abbrev in market.reserves) {
        let reserve = market.reserves[abbrev];
        let accruedUntil = reserve.accruedUntil;
        while (accruedUntil.add(MAX_ACCRUAL_SECONDS).lt(new anchor_1.BN(Math.floor(Date.now() / 1000)))) {
            const refreshReserveIx = buildRefreshReserveIx(abbrev);
            const ix = [
                refreshReserveIx
            ].filter(ix => ix);
            try {
                result = await (0, programUtil_1.sendTransaction)(program.provider, ix);
            }
            catch (err) {
                console.log((0, programUtil_1.transactionErrorToString)(err));
                return [JetTypes_1.TxnResponse.Failed, null];
            }
            accruedUntil = accruedUntil.add(MAX_ACCRUAL_SECONDS);
        }
    }
    return result;
};
const buildRefreshReserveIx = (abbrev) => {
    if (!program) {
        return;
    }
    let reserve = market.reserves[abbrev];
    const refreshInstruction = program.instruction.refreshReserve({
        accounts: {
            market: market.accountPubkey,
            marketAuthority: market.authorityPubkey,
            reserve: reserve.accountPubkey,
            feeNoteVault: reserve.feeNoteVaultPubkey,
            depositNoteMint: reserve.depositNoteMintPubkey,
            pythOraclePrice: reserve.pythPricePubkey,
            tokenProgram: spl_token_2.TOKEN_PROGRAM_ID,
        },
    });
    return refreshInstruction;
};
// Faucet
const airdrop = async (abbrev, lamports) => {
    if (program == null || user.assets == null || !user.wallet) {
        return [JetTypes_1.TxnResponse.Failed, null];
    }
    let reserve = market.reserves[abbrev];
    const asset = Object.values(user.assets.tokens).find(asset => asset.tokenMintPubkey.equals(reserve.tokenMintPubkey));
    if (asset == null) {
        return [JetTypes_1.TxnResponse.Failed, null];
    }
    let ix = [];
    let signers = [];
    //optionally create a token account for wallet
    let ok = JetTypes_1.TxnResponse.Failed, txid;
    if (!asset.walletTokenExists) {
        const createTokenAccountIx = spl_token_2.Token.createAssociatedTokenAccountInstruction(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_2.TOKEN_PROGRAM_ID, asset.tokenMintPubkey, asset.walletTokenPubkey, user.wallet.publicKey, user.wallet.publicKey);
        ix.push(createTokenAccountIx);
    }
    if (reserve.tokenMintPubkey.equals(spl_token_1.NATIVE_MINT)) {
        // Sol airdrop
        try {
            // Use a specific endpoint. A hack because some devnet endpoints are unable to airdrop
            const endpoint = new anchor.web3.Connection('https://api.devnet.solana.com', (anchor.Provider.defaultOptions()).commitment);
            const txid = await endpoint.requestAirdrop(user.wallet.publicKey, parseInt(lamports.toString()));
            console.log(`Transaction ${(0, programUtil_1.explorerUrl)(txid)}`);
            const confirmation = await endpoint.confirmTransaction(txid);
            if (confirmation.value.err) {
                console.error(`Airdrop error: ${(0, programUtil_1.transactionErrorToString)(confirmation.value.err.toString())}`);
                return [JetTypes_1.TxnResponse.Failed, txid];
            }
            else {
                return [JetTypes_1.TxnResponse.Success, txid];
            }
        }
        catch (error) {
            console.error(`Airdrop error: ${(0, programUtil_1.transactionErrorToString)(error)}`);
            exports.rollbar.error(`Airdrop error: ${(0, programUtil_1.transactionErrorToString)(error)}`);
            return [JetTypes_1.TxnResponse.Failed, null];
        }
    }
    else if (reserve.faucetPubkey) {
        // Faucet airdrop
        const faucetAirdropIx = await buildFaucetAirdropIx(lamports, reserve.tokenMintPubkey, asset.walletTokenPubkey, reserve.faucetPubkey);
        ix.push(faucetAirdropIx);
        [ok, txid] = await (0, programUtil_1.sendTransaction)(program.provider, ix, signers);
    }
    else {
        // Mint to the destination token account
        const mintToIx = spl_token_2.Token.createMintToInstruction(spl_token_2.TOKEN_PROGRAM_ID, reserve.tokenMintPubkey, asset.walletTokenPubkey, user.wallet.publicKey, [], new spl_token_2.u64(lamports.toArray()));
        ix.push(mintToIx);
        [ok, txid] = await (0, programUtil_1.sendTransaction)(program.provider, ix, signers);
    }
    return [ok, txid];
};
exports.airdrop = airdrop;
const buildFaucetAirdropIx = async (amount, tokenMintPublicKey, destinationAccountPubkey, faucetPubkey) => {
    const pubkeyNonce = await web3_js_1.PublicKey.findProgramAddress([new TextEncoder().encode("faucet")], FAUCET_PROGRAM_ID);
    const keys = [
        { pubkey: pubkeyNonce[0], isSigner: false, isWritable: false },
        {
            pubkey: tokenMintPublicKey,
            isSigner: false,
            isWritable: true
        },
        { pubkey: destinationAccountPubkey, isSigner: false, isWritable: true },
        { pubkey: spl_token_2.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: faucetPubkey, isSigner: false, isWritable: false }
    ];
    return new web3_js_1.TransactionInstruction({
        programId: FAUCET_PROGRAM_ID,
        data: buffer_1.Buffer.from([1, ...amount.toArray("le", 8)]),
        keys
    });
};
//Take error code and and return error explanation
const getErrNameAndMsg = (errCode) => {
    const code = Number(errCode);
    if (code >= 100 && code < 300) {
        return `This is an Anchor program error code ${code}. Please check here: https://github.com/project-serum/anchor/blob/master/lang/src/error.rs`;
    }
    for (let i = 0; i < customProgramErrors.length; i++) {
        const err = customProgramErrors[i];
        if (err.code === code) {
            return `\n\nCustom Program Error Code: ${errCode} \n- ${err.name} \n- ${err.msg}`;
        }
    }
    return `No matching error code description or translation for ${errCode}`;
};
exports.getErrNameAndMsg = getErrNameAndMsg;
//get the custom program error code if there's any in the error message and return parsed error code hex to number string
/**
 * Get the custom program error code if there's any in the error message and return parsed error code hex to number string
 * @param errMessage string - error message that would contain the word "custom program error:" if it's a customer program error
 * @returns [boolean, string] - probably not a custom program error if false otherwise the second element will be the code number in string
 */
const getCustomProgramErrorCode = (errMessage) => {
    const index = errMessage.indexOf('custom program error:');
    if (index == -1) {
        return [false, 'May not be a custom program error'];
    }
    else {
        return [true, `${parseInt(errMessage.substring(index + 22, index + 28).replace(' ', ''), 16)}`];
    }
};
exports.getCustomProgramErrorCode = getCustomProgramErrorCode;
//# sourceMappingURL=jet.js.map