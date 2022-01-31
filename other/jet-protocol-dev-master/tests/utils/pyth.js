"use strict";
/**
 * Utilities for mocking Pyth during tests
 *
 * @module
 */
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
exports.PythUtils = void 0;
const pyth = __importStar(require("@pythnetwork/client"));
const web3_js_1 = require("@solana/web3.js");
const data_1 = require("./data");
const PRICE_ACCOUNT_SIZE = 3312;
class PythUtils {
    constructor(conn, wallet) {
        this.conn = conn;
        this.wallet = wallet;
        this.config = new data_1.DataManager(conn, wallet);
    }
    /**
     * Create an account large enough to store the Pyth price data
     *
     * @returns The keypair for the created account.
     */
    async createPriceAccount() {
        return this.config.createAccount(PRICE_ACCOUNT_SIZE);
    }
    /**
     * Create an account large enough to store the Pyth product data
     *
     * @returns The keypair for the created account.
     */
    async createProductAccount() {
        return this.createPriceAccount();
    }
    /**
     * Update a Pyth price account with new data
     * @param account The account to update
     * @param data The new data to place in the account
     */
    async updatePriceAccount(account, data) {
        const buf = Buffer.alloc(512);
        const d = getPriceDataWithDefaults(data);
        d.aggregatePriceInfo = getPriceInfoWithDefaults(d.aggregatePriceInfo);
        writePriceBuffer(buf, 0, d);
        await this.config.store(account, 0, buf);
    }
    /**
     * Update a Pyth price account with new data
     * @param account The account to update
     * @param data The new data to place in the account
     */
    async updateProductAccount(account, data) {
        const buf = Buffer.alloc(512);
        const d = getProductWithDefaults(data);
        writeProductBuffer(buf, 0, d);
        await this.config.store(account, 0, buf);
    }
}
exports.PythUtils = PythUtils;
PythUtils.programId = data_1.DataManager.programId;
function writePublicKeyBuffer(buf, offset, key) {
    buf.write(key.toBuffer().toString("binary"), offset, "binary");
}
function writePriceBuffer(buf, offset, data) {
    buf.writeUInt32LE(pyth.Magic, offset + 0);
    buf.writeUInt32LE(data.version, offset + 4);
    buf.writeUInt32LE(data.type, offset + 8);
    buf.writeUInt32LE(data.size, offset + 12);
    buf.writeUInt32LE(convertPriceType(data.priceType), offset + 16);
    buf.writeInt32LE(data.exponent, offset + 20);
    buf.writeUInt32LE(data.priceComponents.length, offset + 24);
    buf.writeBigUInt64LE(data.currentSlot, offset + 32);
    buf.writeBigUInt64LE(data.validSlot, offset + 40);
    writePublicKeyBuffer(buf, offset + 112, data.productAccountKey);
    writePublicKeyBuffer(buf, offset + 144, data.nextPriceAccountKey);
    writePublicKeyBuffer(buf, offset + 176, data.aggregatePriceUpdaterAccountKey);
    writePriceInfoBuffer(buf, 208, data.aggregatePriceInfo);
    let pos = offset + 240;
    for (const component of data.priceComponents) {
        writePriceComponentBuffer(buf, pos, component);
        pos += 96;
    }
}
function writePriceInfoBuffer(buf, offset, info) {
    buf.writeBigInt64LE(info.price, offset + 0);
    buf.writeBigUInt64LE(info.conf, offset + 8);
    buf.writeUInt32LE(convertPriceStatus(info.status), offset + 16);
    buf.writeBigUInt64LE(info.pubSlot, offset + 24);
}
function writePriceComponentBuffer(buf, offset, component) {
    component.publisher.toBuffer().copy(buf, offset);
    writePriceInfoBuffer(buf, offset + 32, component.agg);
    writePriceInfoBuffer(buf, offset + 64, component.latest);
}
function writeProductBuffer(buf, offset, product) {
    let accountSize = product.size;
    if (!accountSize) {
        accountSize = 48;
        for (const key in product.attributes) {
            accountSize += 1 + key.length;
            accountSize += 1 + product.attributes[key].length;
        }
    }
    buf.writeUInt32LE(pyth.Magic, offset + 0);
    buf.writeUInt32LE(product.version, offset + 4);
    buf.writeUInt32LE(product.atype, offset + 8);
    buf.writeUInt32LE(accountSize, offset + 12);
    writePublicKeyBuffer(buf, offset + 16, product.priceAccount);
    let pos = offset + 48;
    for (const key in product.attributes) {
        buf.writeUInt8(key.length, pos);
        buf.write(key, pos + 1);
        pos += 1 + key.length;
        const value = product.attributes[key];
        buf.writeUInt8(value.length, pos);
        buf.write(value, pos + 1);
    }
}
function convertPriceType(type) {
    return 1;
}
function convertPriceStatus(status) {
    return 1;
}
function getPriceDataWithDefaults({ version = pyth.Version2, type = 0, size = PRICE_ACCOUNT_SIZE, priceType = "price", exponent = 0, currentSlot = 0n, validSlot = 0n, productAccountKey = web3_js_1.PublicKey.default, nextPriceAccountKey = web3_js_1.PublicKey.default, aggregatePriceUpdaterAccountKey = web3_js_1.PublicKey.default, aggregatePriceInfo = {}, priceComponents = [], }) {
    return {
        version,
        type,
        size,
        priceType,
        exponent,
        currentSlot,
        validSlot,
        productAccountKey,
        nextPriceAccountKey,
        aggregatePriceUpdaterAccountKey,
        aggregatePriceInfo,
        priceComponents,
    };
}
function getPriceInfoWithDefaults({ price = 0n, conf = 0n, status = "trading", corpAct = "no_corp_act", pubSlot = 0n, }) {
    return {
        price,
        conf,
        status,
        corpAct,
        pubSlot,
    };
}
function getProductWithDefaults({ version = pyth.Version2, atype = 2, size = 0, priceAccount = web3_js_1.PublicKey.default, attributes = {}, }) {
    return {
        version,
        atype,
        size,
        priceAccount,
        attributes,
    };
}
//# sourceMappingURL=pyth.js.map