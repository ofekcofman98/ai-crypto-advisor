jest.mock('../../shared/database/prismaClient');

import request from 'supertest';
import app from '../../app';
import { prisma } from '../../shared/database/prismaClient';
import type { DeepMockProxy } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

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

      const response = await request(app)
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
      const response = await request(app)
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
      const realHashedPassword = await bcrypt.hash('SecurePassword123!', 10);
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: realHashedPassword,
      });

      const response = await request(app)
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