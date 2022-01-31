"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDL_METADATA = exports.ANCHOR_CODER = exports.ANCHOR_WEB3_CONNECTION = exports.CUSTOM_PROGRAM_ERRORS = exports.PROGRAM = exports.COPILOT = exports.USER = exports.MARKET = exports.INIT_FAILED = void 0;
const store_1 = require("svelte/store");
// Overall app init
exports.INIT_FAILED = (0, store_1.writable)(false);
// Market
exports.MARKET = (0, store_1.writable)({
    // Accounts
    accountPubkey: {},
    authorityPubkey: {},
    // Hardcode minimum c-ratio to 130% for now
    minColRatio: 1.3,
    // Total value of all reserves
    totalValueLocked: 0,
    // Reserves
    reserves: {},
    reservesArray: [],
    currentReserve: {},
    // Native vs USD UI values
    nativeValues: true,
});
// User
let user;
exports.USER = (0, store_1.writable)({
    // Locale
    locale: null,
    geobanned: false,
    // Wallet
    connectingWallet: true,
    wallet: null,
    walletInit: false,
    tradeAction: 'deposit',
    // Assets and position
    assets: null,
    walletBalances: {},
    collateralBalances: {},
    loanBalances: {},
    position: {
        depositedValue: 0,
        borrowedValue: 0,
        colRatio: 0,
        utilizationRate: 0
    },
    // Transaction Logs
    transactionLogs: [],
    transactionLogsInit: true,
    // Notifications
    notifications: [],
    // Add notification
    addNotification: (n) => {
        const notifs = user.notifications ?? [];
        notifs.push(n);
        const index = notifs.indexOf(n);
        exports.USER.update(user => {
            user.notifications = notifs;
            return user;
        });
        setTimeout(() => {
            if (user.notifications[index] && user.notifications[index].text === n.text) {
                user.clearNotification(index);
            }
        }, 5000);
    },
    // Clear notification
    clearNotification: (i) => {
        const notifs = user.notifications;
        notifs.splice(i, 1);
        exports.USER.update(user => {
            user.notifications = notifs;
            return user;
        });
    },
    // Settings
    darkTheme: localStorage.getItem('jetDark') === 'true',
    navExpanded: localStorage.getItem('jetNavExpanded') === 'true',
    language: localStorage.getItem('jetPreferredLanguage') ?? 'en',
    rpcNode: localStorage.getItem('jetPreferredNode') ?? '',
    rpcPing: 0,
});
exports.USER.subscribe(data => user = data);
// Copilot
exports.COPILOT = (0, store_1.writable)(null);
// Program
exports.PROGRAM = (0, store_1.writable)(null);
exports.CUSTOM_PROGRAM_ERRORS = (0, store_1.writable)([]);
exports.ANCHOR_WEB3_CONNECTION = (0, store_1.writable)(undefined);
exports.ANCHOR_CODER = (0, store_1.writable)(undefined);
exports.IDL_METADATA = (0, store_1.writable)(undefined);
//# sourceMappingURL=store.js.map