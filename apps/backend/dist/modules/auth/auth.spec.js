"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock('../../shared/database/prismaClient');
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app"));
const prismaClient_1 = require("../../shared/database/prismaClient");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prismaMock = prismaClient_1.prisma;
describe('Auth Module Integration Tests', () => {
    const mockUser = {
        id: 'user-uuid-123',
        email: 'test@moveo.ai',
        name: 'Ofek Cofman',
        passwordHash: 'hashed_password_placeholder',
        hasCompletedOnboarding: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    describe('POST /api/auth/register', () => {
        it('should successfully register a new user and return a JWT access token', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);
            prismaMock.user.create.mockResolvedValue(mockUser);
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/register')
                .send({
                email: 'test@moveo.ai',
                name: 'Ofek Cofman',
                password: 'SecurePassword123!',
            });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('accessToken');
            expect(response.body.user).toEqual({
                id: mockUser.id,
                email: mockUser.email,
                name: mockUser.name,
                hasCompletedOnboarding: false,
            });
        });
        it('should return 400 Bad Request if validation fails (Zod Check)', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/register')
                .send({
                email: 'not-an-email',
            });
            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Validation failed.');
        });
    });
    describe('POST /api/auth/login', () => {
        it('should successfully authenticate user with valid credentials', async () => {
            const realHashedPassword = await bcryptjs_1.default.hash('SecurePassword123!', 10);
            prismaMock.user.findUnique.mockResolvedValue({
                ...mockUser,
                passwordHash: realHashedPassword,
            });
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/login')
                .send({
                email: 'test@moveo.ai',
                password: 'SecurePassword123!',
            });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('accessToken');
            expect(response.body.user.email).toBe(mockUser.email);
        });
    });
});
