"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveUserOnboarding = saveUserOnboarding;
const prismaClient_1 = require("../../shared/database/prismaClient");
async function saveUserOnboarding(userId, data) {
    return await prismaClient_1.prisma.preference.update({
        where: { userId },
        data: {
            cryptoAssets: data.cryptoAssets,
            investorType: data.investorType,
            contentTypes: data.contentTypes,
            user: {
                update: {
                    hasCompletedOnboarding: true,
                },
            },
        },
    });
}
