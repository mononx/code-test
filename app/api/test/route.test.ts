import { POST } from './route';
import { prisma } from '@/app/lib/prisma';
import { redis } from '@/app/lib/redis';

jest.mock('@/app/lib/prisma', () => ({
  prisma:   {
    test: {
        findUnique: jest.fn(),
        create: jest.fn(),
        },
    },
}));

jest.mock('@/app/lib/redis', () => ({
  redis:   {
        get: jest.fn(),
        set: jest.fn(),
    },
}));

describe('POST /api/test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Cases', () => {
    it('if json is invalid', async () => {
      const req = new Request('http://localhost:3000/api/test', {
        method: 'POST',
      });
      jest.spyOn(req, 'json').mockRejectedValueOnce(new SyntaxError());

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid JSON body',
      });
    });

    it('if id1 or id2 is missing', async () => {
      const req = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ id1: '123' }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Bad Request',
        message: 'Both id1 and id2 are required',
      });
    });

    it('if id1 or id2 is not a string', async () => {
      const req = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ id1: 123, id2: '456' }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Bad Request',
        message: 'id1 and id2 must be strings',
      });
    });
  });

  describe('Success Cases', () => {
    const validBody = { id1: '123', id2: '456' };

    it('if cache hit, direct return without querying database', async () => {
      const mockGet = redis.get as any;
      mockGet.mockResolvedValueOnce('cached-uuid-123');

      const req = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify(validBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({
        success: true,
        userID: 'cached-uuid-123',
        message: 'Record already exists in cache',
      });
      expect(redis.get).toHaveBeenCalledWith('test_record:123_456');
      expect(prisma.test.findUnique).not.toHaveBeenCalled();
    });

    it('if database hit, write to cache and return', async () => {
      const mockGet = redis.get as any;
      const mockFindUnique = prisma.test.findUnique as any;

      mockGet.mockResolvedValueOnce(null);
      mockFindUnique.mockResolvedValueOnce({
        id1: '123',
        id2: '456',
        userID: 'db-uuid-456',
      });

      const req = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify(validBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({
        success: true,
        userID: 'db-uuid-456',
        message: 'Record already exists',
      });
      expect(redis.set).toHaveBeenCalledWith('test_record:123_456', 'db-uuid-456', 'EX', 3600);
    });

    it('if first time creation: Redis and DB both have no data, should create new record and write to Redis', async () => {
      const mockGet = redis.get as any;
      const mockFindUnique = prisma.test.findUnique as any;
      const mockCreate = prisma.test.create as any;

      mockGet.mockResolvedValueOnce(null);
      mockFindUnique.mockResolvedValueOnce(null);
      mockCreate.mockResolvedValueOnce({
        id1: '123',
        id2: '456',
        userID: 'uuid-uuid',
      });

      const req = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify(validBody),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.userID).toBeDefined();
      expect(prisma.test.create).toHaveBeenCalledTimes(1);
      expect(redis.set).toHaveBeenCalledWith(
        'test_record:123_456',
        expect.any(String),
        'EX',
        3600
      );
    });
  });
});