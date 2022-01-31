"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeToAssets = exports.subscribeToMarket = void 0;
const spl_token_1 = require("@solana/spl-token");
const anchor_1 = require("@project-serum/anchor");
const client_1 = require("@pythnetwork/client");
const store_1 = require("../store");
const programUtil_1 = require("./programUtil");
const util_1 = require("./util");
const layout_1 = require("./layout");
let market;
let user;
store_1.MARKET.subscribe(data => market = data);
store_1.USER.subscribe(data => user = data);
const subscribeToMarket = async (idlMeta, connection, coder) => {
    let promise;
    const promises = [];
    // Market subscription 
    let timeStart = Date.now();
    promise = (0, programUtil_1.getAccountInfoAndSubscribe)(connection, idlMeta.market.market, account => {
        if (account != null) {
            store_1.MARKET.update(market => {
                console.assert(layout_1.MarketReserveInfoList.span == 12288);
                const decoded = (0, programUtil_1.parseMarketAccount)(account.data, coder);
                for (const reserveStruct of decoded.reserves) {
                    for (const abbrev in market.reserves) {
                        if (market.reserves[abbrev].accountPubkey.equals(reserveStruct.reserve)) {
                            const reserve = market.reserves[abbrev];
                            reserve.liquidationPremium = reserveStruct.liquidationBonus;
                            reserve.depositNoteExchangeRate = reserveStruct.depositNoteExchangeRate;
                            reserve.loanNoteExchangeRate = reserveStruct.loanNoteExchangeRate;
                            deriveValues(reserve, user.assets?.tokens[reserve.abbrev]);
                            break;
                        }
                    }
                }
                return market;
            });
        }
    });
    // Set ping of RPC call
    promise.then(() => {
        let timeEnd = Date.now();
        store_1.USER.update(user => {
            user.rpcPing = timeEnd - timeStart;
            return user;
        });
    });
    promises.push(promise);
    for (const reserveMeta of idlMeta.reserves) {
        // Reserve
        promise = (0, programUtil_1.getAccountInfoAndSubscribe)(connection, reserveMeta.accounts.reserve, account => {
            if (account != null) {
                store_1.MARKET.update(market => {
                    const decoded = (0, programUtil_1.parseReserveAccount)(account.data, coder);
                    // Hardcoding min c-ratio to 130% for now
                    // market.minColRatio = decoded.config.minCollateralRatio / 10000;
                    const reserve = market.reserves[reserveMeta.abbrev];
                    reserve.maximumLTV = decoded.config.minCollateralRatio;
                    reserve.liquidationPremium = decoded.config.liquidationPremium;
                    reserve.outstandingDebt = new util_1.TokenAmount(decoded.state.outstandingDebt, reserveMeta.decimals).divb(new anchor_1.BN(Math.pow(10, 15)));
                    reserve.accruedUntil = decoded.state.accruedUntil;
                    reserve.config = decoded.config;
                    deriveValues(reserve, user.assets?.tokens[reserve.abbrev]);
                    return market;
                });
            }
        });
        promises.push(promise);
        // Deposit Note Mint
        promise = (0, programUtil_1.getMintInfoAndSubscribe)(connection, reserveMeta.accounts.depositNoteMint, amount => {
            if (amount != null) {
                store_1.MARKET.update(market => {
                    let reserve = market.reserves[reserveMeta.abbrev];
                    reserve.depositNoteMint = amount;
                    deriveValues(reserve, user.assets?.tokens[reserve.abbrev]);
                    return market;
                });
            }
        });
        promises.push(promise);
        // Loan Note Mint
        promise = (0, programUtil_1.getMintInfoAndSubscribe)(connection, reserveMeta.accounts.loanNoteMint, amount => {
            if (amount != null) {
                store_1.MARKET.update(market => {
                    let reserve = market.reserves[reserveMeta.abbrev];
                    reserve.loanNoteMint = amount;
                    deriveValues(reserve, user.assets?.tokens[reserve.abbrev]);
                    return market;
                });
            }
        });
        promises.push(promise);
        // Reserve Vault
        promise = (0, programUtil_1.getTokenAccountAndSubscribe)(connection, reserveMeta.accounts.vault, reserveMeta.decimals, amount => {
            if (amount != null) {
                store_1.MARKET.update(market => {
                    let reserve = market.reserves[reserveMeta.abbrev];
                    reserve.availableLiquidity = amount;
                    deriveValues(reserve, user.assets?.tokens[reserve.abbrev]);
                    return market;
                });
            }
        });
        promises.push(promise);
        // Reserve Token Mint
        promise = (0, programUtil_1.getMintInfoAndSubscribe)(connection, reserveMeta.accounts.tokenMint, amount => {
            if (amount != null) {
                store_1.MARKET.update(market => {
                    let reserve = market.reserves[reserveMeta.abbrev];
                    reserve.tokenMint = amount;
                    deriveValues(reserve, user.assets?.tokens[reserve.abbrev]);
                    return market;
                });
            }
        });
        promises.push(promise);
        // Pyth Price
        promise = (0, programUtil_1.getAccountInfoAndSubscribe)(connection, reserveMeta.accounts.pythPrice, account => {
            if (account != null) {
                store_1.MARKET.update(market => {
                    let reserve = market.reserves[reserveMeta.abbrev];
                    reserve.price = (0, client_1.parsePriceData)(account.data).price;
                    deriveValues(reserve, user.assets?.tokens[reserve.abbrev]);
                    return market;
                });
            }
        });
        promises.push(promise);
    }
    return await Promise.all(promises);
};
exports.subscribeToMarket = subscribeToMarket;
const subscribeToAssets = async (connection, coder, wallet) => {
    let promise;
    let promises = [];
    if (!user.assets) {
        return;
    }
    // Obligation
    promise = (0, programUtil_1.getAccountInfoAndSubscribe)(connection, user.assets.obligationPubkey, account => {
        if (account != null) {
            store_1.USER.update(user => {
                if (user.assets) {
                    user.assets.obligation = {
                        ...account,
                        data: (0, programUtil_1.parseObligationAccount)(account.data, coder),
                    };
                }
                return user;
            });
        }
    });
    promises.push(promise);
    // Wallet native SOL balance
    promise = (0, programUtil_1.getAccountInfoAndSubscribe)(connection, wallet, account => {
        store_1.USER.update(user => {
            if (user.assets) {
                // Need to be careful constructing a BN from a number.
                // If the user has more than 2^53 lamports it will throw for not having enough precision.
                user.assets.sol = new util_1.TokenAmount(new anchor_1.BN(account?.lamports.toString() ?? "0"), programUtil_1.SOL_DECIMALS);
                // Update wallet SOL balance
                user.walletBalances.SOL = user.assets.sol.uiAmountFloat;
            }
            return user;
        });
    });
    promises.push(promise);
    for (const abbrev in user.assets.tokens) {
        const asset = user.assets.tokens[abbrev];
        const reserve = market.reserves[abbrev];
        // Wallet token account
        promise = (0, programUtil_1.getTokenAccountAndSubscribe)(connection, asset.walletTokenPubkey, reserve.decimals, amount => {
            store_1.USER.update(user => {
                if (user.assets) {
                    user.assets.tokens[reserve.abbrev].walletTokenBalance = amount ?? new util_1.TokenAmount(new anchor_1.BN(0), reserve.decimals);
                    user.assets.tokens[reserve.abbrev].walletTokenExists = !!amount;
                    // Update wallet token balance
                    if (!asset.tokenMintPubkey.equals(spl_token_1.NATIVE_MINT)) {
                        user.walletBalances[reserve.abbrev] = asset.walletTokenBalance.uiAmountFloat;
                    }
                    deriveValues(reserve, user.assets.tokens[reserve.abbrev]);
                }
                return user;
            });
        });
        promises.push(promise);
        // Reserve deposit notes
        promise = (0, programUtil_1.getTokenAccountAndSubscribe)(connection, asset.depositNoteDestPubkey, reserve.decimals, amount => {
            store_1.USER.update(user => {
                if (user.assets) {
                    user.assets.tokens[reserve.abbrev].depositNoteDestBalance = amount ?? util_1.TokenAmount.zero(reserve.decimals);
                    user.assets.tokens[reserve.abbrev].depositNoteDestExists = !!amount;
                    deriveValues(reserve, user.assets.tokens[reserve.abbrev]);
                }
                return user;
            });
        });
        promises.push(promise);
        // Deposit notes account
        promise = (0, programUtil_1.getTokenAccountAndSubscribe)(connection, asset.depositNotePubkey, reserve.decimals, amount => {
            store_1.USER.update(user => {
                if (user.assets) {
                    user.assets.tokens[reserve.abbrev].depositNoteBalance = amount ?? util_1.TokenAmount.zero(reserve.decimals);
                    user.assets.tokens[reserve.abbrev].depositNoteExists = !!amount;
                    deriveValues(reserve, user.assets.tokens[reserve.abbrev]);
                }
                return user;
            });
        });
        promises.push(promise);
        // Obligation loan notes
        promise = (0, programUtil_1.getTokenAccountAndSubscribe)(connection, asset.loanNotePubkey, reserve.decimals, amount => {
            store_1.USER.update(user => {
                if (user.assets) {
                    user.assets.tokens[reserve.abbrev].loanNoteBalance = amount ?? util_1.TokenAmount.zero(reserve.decimals);
                    user.assets.tokens[reserve.abbrev].loanNoteExists = !!amount;
                    deriveValues(reserve, user.assets.tokens[reserve.abbrev]);
                }
                return user;
            });
        });
        promises.push(promise);
        // Obligation collateral notes
        promise = (0, programUtil_1.getTokenAccountAndSubscribe)(connection, asset.collateralNotePubkey, reserve.decimals, amount => {
            store_1.USER.update(user => {
                if (user.assets) {
                    user.assets.tokens[reserve.abbrev].collateralNoteBalance = amount ?? util_1.TokenAmount.zero(reserve.decimals);
                    user.assets.tokens[reserve.abbrev].collateralNoteExists = !!amount;
                    deriveValues(reserve, user.assets.tokens[reserve.abbrev]);
                }
                return user;
            });
        });
        promises.push(promise);
    }
    return await Promise.all(promises);
};
exports.subscribeToAssets = subscribeToAssets;
// Derive market reserve and user asset values, update global objects
const deriveValues = (reserve, asset) => {
    // Derive market reserve values
    reserve.marketSize = reserve.outstandingDebt.add(reserve.availableLiquidity);
    reserve.utilizationRate = reserve.marketSize.isZero() ? 0
        : reserve.outstandingDebt.uiAmountFloat / reserve.marketSize.uiAmountFloat;
    const ccRate = (0, programUtil_1.getCcRate)(reserve.config, reserve.utilizationRate);
    reserve.borrowRate = (0, programUtil_1.getBorrowRate)(ccRate, reserve.config.manageFeeRate);
    reserve.depositRate = (0, programUtil_1.getDepositRate)(ccRate, reserve.utilizationRate);
    // Update market total value locked and reserve array from new values
    let tvl = 0;
    let reservesArray = [];
    for (let r in market.reserves) {
        tvl += market.reserves[r].marketSize.muln(market.reserves[r].price)?.uiAmountFloat;
        reservesArray.push(market.reserves[r]);
    }
    store_1.MARKET.update(market => {
        market.totalValueLocked = tvl;
        market.reservesArray = reservesArray;
        return market;
    });
    // Derive user asset values
    if (asset) {
        asset.depositBalance = asset.depositNoteBalance.mulb(reserve.depositNoteExchangeRate).divb(new anchor_1.BN(Math.pow(10, 15)));
        asset.loanBalance = asset.loanNoteBalance.mulb(reserve.loanNoteExchangeRate).divb(new anchor_1.BN(Math.pow(10, 15)));
        asset.collateralBalance = asset.collateralNoteBalance.mulb(reserve.depositNoteExchangeRate).divb(new anchor_1.BN(Math.pow(10, 15)));
        // Update user obligation balances
        user.collateralBalances[reserve.abbrev] = asset.collateralBalance.uiAmountFloat;
        user.loanBalances[reserve.abbrev] = asset.loanBalance.uiAmountFloat;
        // Update user position object for UI
        user.position = {
            depositedValue: 0,
            borrowedValue: 0,
            colRatio: 0,
            utilizationRate: 0
        };
        for (let t in user.assets?.tokens) {
            user.position.depositedValue += user.collateralBalances[t] * market.reserves[t].price;
            user.position.borrowedValue += user.loanBalances[t] * market.reserves[t].price;
            user.position.colRatio = user.position.borrowedValue ? user.position.depositedValue / user.position.borrowedValue : 0;
            user.position.utilizationRate = user.position.depositedValue ? user.position.borrowedValue / user.position.depositedValue : 0;
        }
        // Max deposit
        asset.maxDepositAmount = user.walletBalances[reserve.abbrev];
        // Max withdraw
        asset.maxWithdrawAmount = user.position.borrowedValue
            ? (user.position.depositedValue - (market.minColRatio * user.position.borrowedValue)) / reserve.price
            : asset.collateralBalance.uiAmountFloat;
        if (asset.maxWithdrawAmount > asset.collateralBalance.uiAmountFloat) {
            asset.maxWithdrawAmount = asset.collateralBalance.uiAmountFloat;
        }
        // Max borrow
        asset.maxBorrowAmount = ((user.position.depositedValue / market.minColRatio) - user.position.borrowedValue) / reserve.price;
        if (asset.maxBorrowAmount > reserve.availableLiquidity.uiAmountFloat) {
            asset.maxBorrowAmount = reserve.availableLiquidity.uiAmountFloat;
        }
        // Max repay
        if (user.walletBalances[reserve.abbrev] < asset.loanBalance.uiAmountFloat) {
            asset.maxRepayAmount = user.walletBalances[reserve.abbrev];
        }
        else {
            asset.maxRepayAmount = asset.loanBalance.uiAmountFloat;
        }
    }
    ;
};
//# sourceMappingURL=subscribe.js.map