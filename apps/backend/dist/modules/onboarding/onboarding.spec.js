"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock('../../shared/database/prismaClient');
const supertest_1 = __importDefault(require("supertest"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = __importDefault(require("../../app"));
const prismaClient_1 = require("../../shared/database/prismaClient");
const client_1 = require("@prisma/client");
const prismaMock = prismaClient_1.prisma;
const JWT_SECRET = 'fallback_secret_key';
const mockUserId = 'user-uuid-456';
const mockUserEmail = 'onboarding@moveo.ai';
const validToken = jsonwebtoken_1.default.sign({ userId: mockUserId, email: mockUserEmail }, JWT_SECRET, { expiresIn: '1h' });
const validPayload = {
    cryptoAssets: ['BTC', 'ETH'],
    investorType: client_1.InvestorType.HODLER,
    contentTypes: [client_1.ContentType.MARKET_NEWS, client_1.ContentType.CHARTS],
};
const mockPreference = {
    id: 'pref-uuid-789',
    userId: mockUserId,
    cryptoAssets: validPayload.cryptoAssets,
    investorType: validPayload.investorType,
    contentTypes: validPayload.contentTypes,
    updatedAt: new Date(),
};
describe('Onboarding Module Integration Tests', () => {
    describe('POST /api/onboarding', () => {
        it('should save preferences and return 200 with the updated preference', async () => {
            prismaMock.preference.update.mockResolvedValue(mockPreference);
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/onboarding')
                .set('Authorization', `Bearer ${validToken}`)
                .send(validPayload);
            expect(response.status).toBe(200);
            expect(response.body.preference).toMatchObject({
                userId: mockUserId,
                cryptoAssets: validPayload.cryptoAssets,
                investorType: validPayload.investorType,
                contentTypes: validPayload.contentTypes,
            });
            expect(prismaMock.preference.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { userId: mockUserId },
                data: expect.objectContaining({
                    cryptoAssets: validPayload.cryptoAssets,
                    investorType: validPayload.investorType,
                    contentTypes: validPayload.contentTypes,
                }),
            }));
        });
        it('should return 401 if the Authorization header is missing', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/onboarding')
                .send(validPayload);
            expect(response.status).toBe(401);
            expect(response.body.status).toBe('error');
        });
        it('should return 401 if the JWT is invalid', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/onboarding')
                .set('Authorization', 'Bearer invalid.token.here')
                .send(validPayload);
            expect(response.status).toBe(401);
            expect(response.body.status).toBe('error');
        });
        it('should return 400 if required fields are missing (Zod Check)', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/onboarding')
                .set('Authorization', `Bearer ${validToken}`)
                .send({});
            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Validation failed.');
        });
        it('should return 400 if cryptoAssets is an empty array (Zod Check)', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/onboarding')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ ...validPayload, cryptoAssets: [] });
            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Validation failed.');
        });
        it('should return 400 if investorType is not a valid enum value (Zod Check)', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/onboarding')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ ...validPayload, investorType: 'WIZARD' });
            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Validation failed.');
        });
        it('should return 400 if contentTypes contains an invalid enum value (Zod Check)', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/onboarding')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ ...validPayload, contentTypes: ['INVALID_TYPE'] });
            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Validation failed.');
        });
    });
});
