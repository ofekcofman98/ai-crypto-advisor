"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardingSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.onboardingSchema = zod_1.z.object({
    cryptoAssets: zod_1.z
        .array(zod_1.z.string()
        .trim()
        .min(1)
        .toUpperCase())
        .min(1, { message: 'Please select at least one crypto asset.' }),
    investorType: zod_1.z.nativeEnum(client_1.InvestorType, {
        message: 'Please select a valid investor type.',
    }),
    contentTypes: zod_1.z
        .array(zod_1.z.nativeEnum(client_1.ContentType))
        .min(1, { message: 'Please select at least one content type.' }),
});
