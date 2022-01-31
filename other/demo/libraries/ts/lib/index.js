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
exports.Amount = exports.JET_ID = exports.DEX_ID_DEVNET = exports.DEX_ID = exports.PLACEHOLDER_ACCOUNT = exports.JetUser = exports.JetReserve = exports.MarketFlags = exports.JetMarket = exports.JetClient = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor = __importStar(require("@project-serum/anchor"));
var client_1 = require("./client");
Object.defineProperty(exports, "JetClient", { enumerable: true, get: function () { return client_1.JetClient; } });
var market_1 = require("./market");
Object.defineProperty(exports, "JetMarket", { enumerable: true, get: function () { return market_1.JetMarket; } });
Object.defineProperty(exports, "MarketFlags", { enumerable: true, get: function () { return market_1.MarketFlags; } });
var reserve_1 = require("./reserve");
Object.defineProperty(exports, "JetReserve", { enumerable: true, get: function () { return reserve_1.JetReserve; } });
var user_1 = require("./user");
Object.defineProperty(exports, "JetUser", { enumerable: true, get: function () { return user_1.JetUser; } });
exports.PLACEHOLDER_ACCOUNT = web3_js_1.PublicKey.default;
// FIXME: this is probably different on devnet
exports.DEX_ID = new web3_js_1.PublicKey("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin");
exports.DEX_ID_DEVNET = new web3_js_1.PublicKey("DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY");
// FIXME: ???
exports.JET_ID = new web3_js_1.PublicKey("4XNgKWTqzddrR5AoKRusqceLCq9efr4T1iZpVkpndPTk");
class Amount {
    constructor(units, value) {
        this.units = units;
        this.value = value;
    }
    static tokens(amount) {
        return new Amount({ tokens: {} }, new anchor.BN(amount));
    }
    static depositNotes(amount) {
        return new Amount({ depositNotes: {} }, new anchor.BN(amount));
    }
    static loanNotes(amount) {
        return new Amount({ loanNotes: {} }, new anchor.BN(amount));
    }
}
exports.Amount = Amount;
//# sourceMappingURL=index.js.map