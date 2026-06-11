"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const asyncHandler_1 = require("../../utils/asyncHandler");
const prismaClient_1 = require("../../shared/database/prismaClient");
const dashboard_service_1 = require("./dashboard.service");
const dashboard_mock_1 = require("./dashboard.mock");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
// ─── GET /api/dashboard/prices ─────────────────────────────────────────────────
router.get('/prices', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    let assetsToFetch = ['BTC', 'ETH'];
    try {
        const prefs = await prismaClient_1.prisma.preference.findUnique({ where: { userId: req.user.id } });
        if (prefs?.cryptoAssets?.length) {
            assetsToFetch = prefs.cryptoAssets;
        }
    }
    catch {
        console.warn('[dashboard.router] DB unreachable for preferences — using default assets.');
    }
    const prices = await (0, dashboard_service_1.getCryptoPrices)(assetsToFetch);
    res.status(200).json(prices);
}));
// ─── GET /api/dashboard/news ───────────────────────────────────────────────────
router.get('/news', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    try {
        const news = await (0, dashboard_service_1.getCryptoNews)();
        res.status(200).json(news);
    }
    catch {
        res.status(200).json(dashboard_mock_1.MOCK_NEWS);
    }
}));
// ─── GET /api/dashboard/insight ───────────────────────────────────────────────
router.get('/insight', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    let investorType = 'HODLER';
    let assets = ['BTC', 'ETH'];
    try {
        const prefs = await prismaClient_1.prisma.preference.findUnique({ where: { userId: req.user.id } });
        if (prefs?.investorType)
            investorType = prefs.investorType;
        if (prefs?.cryptoAssets?.length)
            assets = prefs.cryptoAssets;
    }
    catch {
        console.warn('[dashboard.router] DB unreachable for preferences — using defaults for insight.');
    }
    try {
        const insight = await (0, dashboard_service_1.getAiInsight)(investorType, assets);
        res.status(200).json(insight);
    }
    catch {
        res.status(200).json(dashboard_mock_1.MOCK_INSIGHT);
    }
}));
// ─── GET /api/dashboard/meme ──────────────────────────────────────────────────
router.get('/meme', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    try {
        const meme = await (0, dashboard_service_1.getDailyMemeFallback)();
        res.status(200).json(meme);
    }
    catch {
        res.status(200).json((0, dashboard_mock_1.getDailyMeme)());
    }
}));
exports.default = router;
