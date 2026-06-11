"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCryptoInsight = getCryptoInsight;
const ai_service_1 = require("./ai.service");
const dashboard_service_1 = require("./dashboard.service");
async function getCryptoInsight(investorType, assets) {
    const prices = await (0, dashboard_service_1.getCryptoPrices)(assets);
    return (0, ai_service_1.generateCryptoInsight)(investorType, assets, prices);
}
