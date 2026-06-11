"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByEmail = findUserByEmail;
exports.registerUser = registerUser;
exports.loginUser = loginUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prismaClient_1 = require("../../shared/database/prismaClient");
const AppError_1 = require("../../shared/errors/AppError");
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_secret_key';
const BCRYPT_SALT_ROUNDS = 10;
async function findUserByEmail(email) {
    return await prismaClient_1.prisma.user.findUnique({
        where: { email }
    });
}
async function registerUser(data) {
    const existingUser = await findUserByEmail(data.email);
    if (existingUser) {
        throw new AppError_1.AppError('An account with this email address already exists.', 409);
    }
    const hashedPassword = await bcryptjs_1.default.hash(data.password, BCRYPT_SALT_ROUNDS);
    const newUser = await prismaClient_1.prisma.user.create({
        data: {
            email: data.email,
            name: data.name,
            passwordHash: hashedPassword,
            hasCompletedOnboarding: false,
            preference: {
                create: {
                    cryptoAssets: [],
                    contentTypes: [],
                },
            },
        },
    });
    const token = jsonwebtoken_1.default.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '24h' });
    return {
        accessToken: token,
        user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            hasCompletedOnboarding: newUser.hasCompletedOnboarding,
        },
    };
}
async function loginUser(data) {
    const user = await findUserByEmail(data.email);
    if (!user) {
        throw new AppError_1.AppError('Invalid email or password.', 401);
    }
    const isPasswordValid = await bcryptjs_1.default.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
        throw new AppError_1.AppError('Invalid email or password.', 401);
    }
    const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    return {
        accessToken: token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            hasCompletedOnboarding: user.hasCompletedOnboarding,
        },
    };
}
