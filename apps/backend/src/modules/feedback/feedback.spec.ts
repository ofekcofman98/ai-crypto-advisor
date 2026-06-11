jest.mock('../../shared/database/prismaClient');

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import { prisma } from '../../shared/database/prismaClient';
import { VoteType, SectionType, type PrismaClient } from '@prisma/client';
import type { DeepMockProxy } from 'jest-mock-extended';

const JWT_SECRET = 'fallback_secret_key';
const mockUserId = 'user-uuid-feedback';

const validToken = jwt.sign(
  { userId: mockUserId, email: 'feedback@moveo.ai' },
  JWT_SECRET,
  { expiresIn: '1h' },
);

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const validPayload = {
  contentId: 'btc-price-block',
  sectionType: SectionType.PRICE,
  vote: VoteType.UP,
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
    sectionType: SectionType.PRICE,
    contentId: 'btc-price-block',
    vote: VoteType.UP,
    createdAt: new Date(),
  },
  {
    id: 'feedback-uuid-2',
    sectionType: SectionType.NEWS,
    contentId: 'eth-article-42',
    vote: VoteType.DOWN,
    createdAt: new Date(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────

describe('Feedback Module Integration Tests', () => {
  describe('POST /api/feedback', () => {
    it('Happy Path: should register a UP vote and return 200 with feedback record', async () => {
      prismaMock.feedback.upsert.mockResolvedValue(mockFeedback as never);

      const response = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${validToken}`)
        .send(validPayload);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Feedback registered successfully.');
      expect(response.body.feedback).toMatchObject({
        userId: mockUserId,
        contentId: validPayload.contentId,
        sectionType: validPayload.sectionType,
        vote: VoteType.UP,
      });
      expect(prismaMock.feedback.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_sectionType_contentId: {
              userId: mockUserId,
              sectionType: validPayload.sectionType,
              contentId: validPayload.contentId,
            },
          },
          update: { vote: VoteType.UP },
        }),
      );
    });

    it('Happy Path: should overwrite an existing vote (DOWN) via upsert', async () => {
      const downVoteFeedback = { ...mockFeedback, vote: VoteType.DOWN };
      prismaMock.feedback.upsert.mockResolvedValue(downVoteFeedback as never);

      const response = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ...validPayload, vote: VoteType.DOWN });

      expect(response.status).toBe(200);
      expect(response.body.feedback.vote).toBe(VoteType.DOWN);
      expect(prismaMock.feedback.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: { vote: VoteType.DOWN } }),
      );
    });

    it('Guard Path: should return 401 when the Authorization header is missing', async () => {
      const response = await request(app)
        .post('/api/feedback')
        .send(validPayload);

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('Guard Path: should return 401 when the JWT is invalid', async () => {
      const response = await request(app)
        .post('/api/feedback')
        .set('Authorization', 'Bearer tampered.token.here')
        .send(validPayload);

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('Validation Path: should return 400 when the vote type is invalid (Zod Check)', async () => {
      const response = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ...validPayload, vote: 'SUPER_LIKE' });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Validation failed.');
    });

    it('Validation Path: should return 400 when sectionType is missing (Zod Check)', async () => {
      const { sectionType: _omitted, ...withoutSectionType } = validPayload;

      const response = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${validToken}`)
        .send(withoutSectionType);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Validation failed.');
    });

    it('Validation Path: should return 400 when contentId is an empty string (Zod Check)', async () => {
      const response = await request(app)
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
      prismaMock.feedback.findMany.mockResolvedValue(mockVotesList as never);

      const response = await request(app)
        .get('/api/feedback/my-votes')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        sectionType: SectionType.PRICE,
        contentId: 'btc-price-block',
        vote: VoteType.UP,
      });
      expect(prismaMock.feedback.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: mockUserId } }),
      );
    });

    it('Resiliency Path: should return an empty array with 200 when the DB is unreachable', async () => {
      prismaMock.feedback.findMany.mockRejectedValue(new Error('DB connection lost'));

      const response = await request(app)
        .get('/api/feedback/my-votes')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
});
