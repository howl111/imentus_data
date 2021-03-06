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
exports.getProviderForClusterUrl = void 0;
const anchor = __importStar(require("@project-serum/anchor"));
const web3_js_1 = require("@solana/web3.js");
function getClusterUrl(nameOrUrl) {
    if (["localnet", "localhost"].includes(nameOrUrl)) {
        return "https://api.devnet.solana.com";
    }
    else if (nameOrUrl == "devnet" || nameOrUrl == "mainnet-beta") {
        return (0, web3_js_1.clusterApiUrl)(nameOrUrl);
    }
    else {
        return nameOrUrl;
    }
}
function getProviderForClusterUrl(nameOrUrl) {
    const clusterUrl = getClusterUrl(nameOrUrl);
    return anchor.Provider.local(clusterUrl);
}
exports.getProviderForClusterUrl = getProviderForClusterUrl;
//# sourceMappingURL=cli.js.map