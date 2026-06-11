"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFeedback = registerFeedback;
exports.getUserVotes = getUserVotes;
const prismaClient_1 = require("../../shared/database/prismaClient");
async function registerFeedback(userId, data) {
    return prismaClient_1.prisma.feedback.upsert({
        where: {
            userId_sectionType_contentId: {
                userId,
                sectionType: data.sectionType,
                contentId: data.contentId,
            },
        },
        update: {
            vote: data.vote,
        },
        create: {
            userId,
            sectionType: data.sectionType,
            contentId: data.contentId,
            contentSnippet: data.contentSnippet || 'No snippet provided',
            vote: data.vote,
        },
    });
}
async function getUserVotes(userId) {
    try {
        return await prismaClient_1.prisma.feedback.findMany({
            where: { userId },
            select: {
                id: true,
                sectionType: true,
                contentId: true,
                vote: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    catch {
        console.warn('[feedback.service] DB unreachable for getUserVotes — returning empty array.');
        return [];
    }
}
