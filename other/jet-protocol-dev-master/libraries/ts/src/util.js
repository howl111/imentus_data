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
exports.pubkeyField = exports.numberField = exports.PubkeyField = exports.NumberField = void 0;
const BL = __importStar(require("@solana/buffer-layout"));
const anchor_1 = require("@project-serum/anchor");
const web3_js_1 = require("@solana/web3.js");
class NumberField extends BL.Layout {
    constructor(property) {
        super(24, property);
    }
    decode(b, offset) {
        const start = offset == undefined ? 0 : offset;
        const data = b.slice(start, start + this.span);
        return new anchor_1.BN(data);
    }
    encode(src, b, offset) {
        const start = offset == undefined ? 0 : offset;
        b.set(src.toArray(), start);
        return this.span;
    }
}
exports.NumberField = NumberField;
class PubkeyField extends BL.Layout {
    constructor(property) {
        super(32, property);
    }
    decode(b, offset) {
        const start = offset == undefined ? 0 : offset;
        const data = b.slice(start, start + this.span);
        return new web3_js_1.PublicKey(data);
    }
    encode(src, b, offset) {
        const start = offset == undefined ? 0 : offset;
        b.set(src.toBytes(), start);
        return this.span;
    }
}
exports.PubkeyField = PubkeyField;
function numberField(property) {
    return new NumberField(property);
}
exports.numberField = numberField;
function pubkeyField(property) {
    return new PubkeyField(property);
}
exports.pubkeyField = pubkeyField;
//# sourceMappingURL=util.js.map