import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

export const prismaMock: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>();

// Satisfies the `{ prisma }` named export consumed by all service modules.
export const prisma = prismaMock;

beforeEach(() => {
  mockReset(prismaMock);
});