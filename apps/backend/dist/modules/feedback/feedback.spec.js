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
const JWT_SECRET = 'fallback_secret_key';
const mockUserId = 'user-uuid-feedback';
const validToken = jsonwebtoken_1.default.sign({ userId: mockUserId, email: 'feedback@moveo.ai' }, JWT_SECRET, { expiresIn: '1h' });
const prismaMock = prismaClient_1.prisma;
const validPayload = {
    contentId: 'btc-price-block',
    sectionType: client_1.SectionType.PRICE,
    vote: client_1.VoteType.UP,
    contentSnippet: 'BTC is up 3% today.',
};
const mockFeedback = {
    id: 'feedback-uuid-1',
    userId: mockUserId,
    contentId: validPayload.contentId,
    sectionType: validPayload.sectionType,
    contentSnippet: validPayload.contentSnippet,
    vote: validPayload.vote,
    createdAt: new Date(),
};
const mockVotesList = [
    {
        id: 'feedback-uuid-1',
        sectionType: client_1.SectionType.PRICE,
        contentId: 'btc-price-block',
        vote: client_1.VoteType.UP,
        createdAt: new Date(),
    },
    {
        id: 'feedback-uuid-2',
        sectionType: client_1.SectionType.NEWS,
        contentId: 'eth-article-42',
        vote: client_1.VoteType.DOWN,
        createdAt: new Date(),
    },
];
// ─────────────────────────────────────────────────────────────────────────────
describe('Feedback Module Integration Tests', () => {
    describe('POST /api/feedback', () => {
        it('Happy Path: should register a UP vote and return 200 with feedback record', async () => {
            prismaMock.feedback.upsert.mockResolvedValue(mockFeedback);
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/feedback')
                .set('Authorization', `Bearer ${validToken}`)
                .send(validPayload);
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Feedback registered successfully.');
            expect(response.body.feedback).toMatchObject({
                userId: mockUserId,
                contentId: validPayload.contentId,
                sectionType: validPayload.sectionType,
                vote: client_1.VoteType.UP,
            });
            expect(prismaMock.feedback.upsert).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    userId_sectionType_contentId: {
                        userId: mockUserId,
                        sectionType: validPayload.sectionType,
                        contentId: validPayload.contentId,
                    },
                },
                update: { vote: client_1.VoteType.UP },
            }));
        });
        it('Happy Path: should overwrite an existing vote (DOWN) via upsert', async () => {
            const downVoteFeedback = { ...mockFeedback, vote: client_1.VoteType.DOWN };
            prismaMock.feedback.upsert.mockResolvedValue(downVoteFeedback);
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/feedback')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ ...validPayload, vote: client_1.VoteType.DOWN });
            expect(response.status).toBe(200);
            expect(response.body.feedback.vote).toBe(client_1.VoteType.DOWN);
            expect(prismaMock.feedback.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { vote: client_1.VoteType.DOWN } }));
        });
        it('Guard Path: should return 401 when the Authorization header is missing', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/feedback')
                .send(validPayload);
            expect(response.status).toBe(401);
            expect(response.body.status).toBe('error');
        });
        it('Guard Path: should return 401 when the JWT is invalid', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/feedback')
                .set('Authorization', 'Bearer tampered.token.here')
                .send(validPayload);
            expect(response.status).toBe(401);
            expect(response.body.status).toBe('error');
        });
        it('Validation Path: should return 400 when the vote type is invalid (Zod Check)', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/feedback')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ ...validPayload, vote: 'SUPER_LIKE' });
            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Validation failed.');
        });
        it('Validation Path: should return 400 when sectionType is missing (Zod Check)', async () => {
            const { sectionType: _omitted, ...withoutSectionType } = validPayload;
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/feedback')
                .set('Authorization', `Bearer ${validToken}`)
                .send(withoutSectionType);
            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Validation failed.');
        });
        it('Validation Path: should return 400 when contentId is an empty string (Zod Check)', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/feedback')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ ...validPayload, contentId: '' });
            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Validation failed.');
        });
    });
    describe('GET /api/feedback/my-votes', () => {
        it('Happy Path: should return the list of votes for the authenticated user', async () => {
            prismaMock.feedback.findMany.mockResolvedValue(mockVotesList);
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/feedback/my-votes')
                .set('Authorization', `Bearer ${validToken}`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
            expect(response.body[0]).toMatchObject({
                sectionType: client_1.SectionType.PRICE,
                contentId: 'btc-price-block',
                vote: client_1.VoteType.UP,
            });
            expect(prismaMock.feedback.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: mockUserId } }));
        });
        it('Resiliency Path: should return an empty array with 200 when the DB is unreachable', async () => {
            prismaMock.feedback.findMany.mockRejectedValue(new Error('DB connection lost'));
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/feedback/my-votes')
                .set('Authorization', `Bearer ${validToken}`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });
    });
});
