"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCopilotSuggestion = exports.checkTradeWarning = void 0;
const store_1 = require("../store");
const util_1 = require("./util");
const localization_1 = require("./localization");
let market;
let user;
store_1.MARKET.subscribe(data => market = data);
store_1.USER.subscribe(data => user = data);
// Check user's trade and offer Copilot warning
const checkTradeWarning = (inputAmount, adjustedRatio, submitTrade) => {
    // Depositing all SOL leaving no lamports for fees, inform and reject
    if (user.tradeAction === 'deposit' && market.currentReserve?.abbrev === 'SOL'
        && inputAmount >= (user.walletBalances[market.currentReserve.abbrev] - 0.02)) {
        store_1.COPILOT.set({
            suggestion: {
                good: false,
                detail: localization_1.dictionary[user.language].cockpit.insufficientLamports
            }
        });
        // Borrowing and within danger of liquidation
    }
    else if (user.tradeAction === 'borrow' && adjustedRatio <= market.minColRatio + 0.2) {
        // not below min-ratio, warn and allow trade
        if (adjustedRatio >= market.minColRatio) {
            store_1.COPILOT.set({
                suggestion: {
                    good: false,
                    detail: localization_1.dictionary[user.language].cockpit.subjectToLiquidation
                        .replaceAll('{{NEW-C-RATIO}}', (0, util_1.currencyFormatter)(adjustedRatio * 100, false, 1)),
                    action: {
                        text: localization_1.dictionary[user.language].cockpit.confirm,
                        onClick: () => submitTrade()
                    }
                }
            });
        }
        // below minimum ratio, inform and reject
        if (adjustedRatio < market.minColRatio
            && adjustedRatio < user.position.colRatio) {
            store_1.COPILOT.set({
                suggestion: {
                    good: false,
                    detail: localization_1.dictionary[user.language].cockpit.rejectTrade
                        .replaceAll('{{NEW-C-RATIO}}', (0, util_1.currencyFormatter)(adjustedRatio * 100, false, 1))
                        .replaceAll('{{JET MIN C-RATIO}}', market.minColRatio * 100)
                }
            });
        }
        // Otherwise, submit trade
    }
    else {
        submitTrade();
    }
};
exports.checkTradeWarning = checkTradeWarning;
// Generate suggestion for user based on their current position and market data
const generateCopilotSuggestion = () => {
    if (!market || !user.assets) {
        store_1.COPILOT.set(null);
        return;
    }
    let bestReserveDepositRate = market.reserves.SOL;
    // Find best deposit Rate
    if (market.reserves) {
        for (let a in market.reserves) {
            if (market.reserves[a].depositRate > bestReserveDepositRate.depositRate) {
                bestReserveDepositRate = market.reserves[a];
            }
        }
        ;
    }
    // Conditional AI for suggestion generation
    if (user.position.borrowedValue && (user.position.colRatio < market?.minColRatio)) {
        store_1.COPILOT.set({
            suggestion: {
                good: false,
                overview: localization_1.dictionary[user.language].copilot.suggestions.unhealthy.overview,
                detail: localization_1.dictionary[user.language].copilot.suggestions.unhealthy.detail
                    .replaceAll('{{C-RATIO}}', (0, util_1.currencyFormatter)(user.position.colRatio * 100, false, 1))
                    .replaceAll('{{RATIO BELOW AMOUNT}}', Math.abs(Number((0, util_1.currencyFormatter)((market.minColRatio - user.position.colRatio) * 100, false, 1))))
                    .replaceAll('{{JET MIN C-RATIO}}', market.minColRatio * 100),
                solution: localization_1.dictionary[user.language].copilot.suggestions.unhealthy.solution,
            }
        });
    }
    else if (bestReserveDepositRate?.depositRate && !user.assets.tokens[bestReserveDepositRate.abbrev].walletTokenBalance?.isZero()) {
        store_1.MARKET.update(market => {
            market.currentReserve = bestReserveDepositRate;
            return market;
        });
        store_1.COPILOT.set({
            suggestion: {
                good: true,
                overview: localization_1.dictionary[user.language].copilot.suggestions.deposit.overview
                    .replaceAll('{{BEST DEPOSIT RATE NAME}}', bestReserveDepositRate.name),
                detail: localization_1.dictionary[user.language].copilot.suggestions.deposit.detail
                    .replaceAll('{{BEST DEPOSIT RATE ABBREV}}', bestReserveDepositRate.abbrev)
                    .replaceAll('{{DEPOSIT RATE}}', (bestReserveDepositRate.depositRate * 100).toFixed(2))
                    .replaceAll('{{USER BALANCE}}', (0, util_1.currencyFormatter)(user.assets.tokens[bestReserveDepositRate.abbrev].walletTokenBalance.uiAmountFloat, false, 2))
            }
        });
    }
    else if (user.position.borrowedValue && (user.position.colRatio > market?.minColRatio && user.position.colRatio <= market?.minColRatio + 10)) {
        store_1.COPILOT.set({
            suggestion: {
                good: false,
                overview: localization_1.dictionary[user.language].copilot.warning.tenPercent.overview,
                detail: localization_1.dictionary[user.language].copilot.warning.tenPercent.detail
                    .replaceAll('{{C-RATIO}}', (0, util_1.currencyFormatter)(user.position.colRatio * 100, false, 1))
                    .replaceAll('{{JET MIN C-RATIO}}', market.minColRatio * 100)
            }
        });
    }
    else if (user.position.borrowedValue && (user.position.colRatio >= market?.minColRatio + 10 && user.position.colRatio <= market?.minColRatio + 20)) {
        store_1.COPILOT.set({
            suggestion: {
                good: false,
                overview: localization_1.dictionary[user.language].copilot.warning.twentyPercent.overview,
                detail: localization_1.dictionary[user.language].copilot.warning.twentyPercent.detail
                    .replaceAll('{{C-RATIO}}', (0, util_1.currencyFormatter)(user.position.colRatio * 100, false, 1))
                    .replaceAll('{{JET MIN C-RATIO}}', market.minColRatio * 100)
            }
        });
    }
    else {
        store_1.COPILOT.set({
            suggestion: {
                good: true,
                overview: localization_1.dictionary[user.language].copilot.suggestions.healthy.overview,
                detail: localization_1.dictionary[user.language].copilot.suggestions.healthy.detail
            }
        });
    }
};
exports.generateCopilotSuggestion = generateCopilotSuggestion;
//# sourceMappingURL=copilot.js.map