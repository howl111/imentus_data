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
exports.definitions = exports.dictionary = exports.geoBannedCountries = exports.getLocale = void 0;
const Jet_UI_EN = __importStar(require("./languages/Jet_UI_EN.json"));
const Jet_Definitions_EN = __importStar(require("./languages/Jet_Definitions_EN.json"));
const Jet_UI_ZH = __importStar(require("./languages/Jet_UI_ZH.json"));
const Jet_Definitions_ZH = __importStar(require("./languages/Jet_Definitions_ZH.json"));
const Jet_UI_KR = __importStar(require("./languages/Jet_UI_KR.json"));
const Jet_Definitions_KR = __importStar(require("./languages/Jet_Definitions_KR.json"));
const Jet_UI_RU = __importStar(require("./languages/Jet_UI_RU.json"));
const Jet_Definitions_RU = __importStar(require("./languages/Jet_Definitions_RU.json"));
const Jet_UI_TR = __importStar(require("./languages/Jet_UI_TR.json"));
const Jet_Definitions_TR = __importStar(require("./languages/Jet_Definitions_TR.json"));
const store_1 = require("../store");
// Check to see if user's locale is special case of Crimea
const isCrimea = (locale) => {
    const postalCode = locale?.postal.toString().substring(0, 2);
    if (postalCode === "95" || postalCode === "96" || postalCode === "97" || postalCode === "98") {
        return true;
    }
    else {
        return false;
    }
};
// Get user's preferred language from browser
// Use fallback if not
const getLocale = async () => {
    let locale = null;
    let language = window.navigator.languages[1];
    let geobanned = false;
    let preferredLanguage = localStorage.getItem('jetPreferredLanguage');
    if (!Object.keys(exports.dictionary).includes(language)) {
        language = 'en';
    }
    if (preferredLanguage) {
        language = preferredLanguage;
    }
    try {
        const resp = await fetch('https://ipinfo.io/json?token=46ceefa5641a93', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        locale = await resp.json();
        exports.geoBannedCountries.forEach(c => {
            if (c.code === locale?.country) {
                // If country is Ukraine, checks if first two digits
                // of the postal code further match Crimean postal codes.
                if (locale?.country !== "UA" || isCrimea(locale)) {
                    geobanned = true;
                }
            }
        });
    }
    catch (err) {
        console.log(err);
    }
    store_1.USER.update(user => {
        user.locale = locale;
        user.geobanned = geobanned;
        return user;
    });
};
exports.getLocale = getLocale;
// Banned countries
exports.geoBannedCountries = [
    {
        country: "Afghanistan",
        code: "AF"
    },
    {
        country: "Crimea (Ukraine)",
        code: "UA"
    },
    {
        country: "Cuba",
        code: "CU"
    },
    {
        country: "Democratic Republic of Congo",
        code: "CD"
    },
    {
        country: "Iran",
        code: "IR"
    },
    {
        country: "Iraq",
        code: "IQ"
    },
    {
        country: "Libya",
        code: "LY"
    },
    {
        country: "North Korea",
        code: "KP"
    },
    {
        country: "Sudan",
        code: "SD"
    },
    {
        country: "Syria",
        code: "SY"
    },
    {
        country: "Tajikistan",
        code: "TJ"
    },
    {
        country: "Venezuela",
        code: "VE"
    }
];
// Dictionary of UI text throughout Jet
exports.dictionary = {
    // English
    en: Jet_UI_EN,
    // Mandarin
    zh: Jet_UI_ZH,
    //Russian
    ru: Jet_UI_RU,
    //Turkish
    tr: Jet_UI_TR,
    //Korean
    kr: Jet_UI_KR
};
// Definitions of various terminology
exports.definitions = {
    en: Jet_Definitions_EN,
    zh: Jet_Definitions_ZH,
    ru: Jet_Definitions_RU,
    tr: Jet_Definitions_TR,
    kr: Jet_Definitions_KR
};
//# sourceMappingURL=localization.js.map