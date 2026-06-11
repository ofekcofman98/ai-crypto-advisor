"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCryptoInsight = generateCryptoInsight;
const axios_1 = __importDefault(require("axios"));
function getFallbackInsight(investorType, assets, prices) {
    const assetList = assets.join(', ');
    if (investorType === 'HODLER') {
        return `[Fallback Insight] As a HODLER tracking ${assetList}, the current market volatility is noise. Accumulate during dips and maintain a long-term horizon. Focus on security and cold storage rather than 24h price action.`;
    }
    return `[Fallback Insight] As a DAY_TRADER monitoring ${assetList}, short-term technical indicators are key. Watch the 24h volume closely and set strict stop-losses. The current price action suggests tight ranges.`;
}
async function generateCryptoInsight(investorType, assets, currentPrices) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.warn('OPENROUTER_API_KEY missing. Using fallback AI insights.');
        return getFallbackInsight(investorType, assets, currentPrices);
    }
    try {
        const prompt = `
        You are an expert crypto financial AI advisor. Analyze this user portfolio:
        - Investor Type: ${investorType}
        - Watched Assets: ${assets.join(', ')}
        - Current Market Prices & 24h Changes: ${JSON.stringify(currentPrices)}
  
        Provide a concise, 3-sentence action plan/insight tailored specifically to their investor profile. 
        Do not include disclaimers, greetings, or intro text. Get straight to the analysis.
      `;
        const response = await axios_1.default.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: prompt }],
        }, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:4000',
            },
            timeout: 7000,
        });
        return response.data.choices?.[0]?.message?.content?.trim() || getFallbackInsight(investorType, assets, currentPrices);
    }
    catch (error) {
        console.warn('OpenRouter API failed, serving backup AI insight.');
        return getFallbackInsight(investorType, assets, currentPrices);
    }
}
