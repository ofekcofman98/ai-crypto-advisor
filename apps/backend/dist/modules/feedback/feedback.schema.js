"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voteSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.voteSchema = zod_1.z.object({
    contentId: zod_1.z.string().trim().min(1, { message: 'Content ID is required.' }),
    sectionType: zod_1.z.nativeEnum(client_1.SectionType, {
        message: 'Invalid section type. Must be NEWS, PRICE, AI_INSIGHT, or MEME.',
    }),
    vote: zod_1.z.nativeEnum(client_1.VoteType, {
        message: 'Vote must be either UP or DOWN.',
    }),
    contentSnippet: zod_1.z.string().default('No snippet provided'),
});
