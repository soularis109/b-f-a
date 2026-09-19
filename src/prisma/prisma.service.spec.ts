import { PrismaService } from './prisma.service.js';

describe('PrismaService', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('connects and disconnects using an in-memory SQLite database', async () => {
    process.env.DATABASE_URL = ':memory:';
    const service = new PrismaService();

    await expect(service.onModuleInit()).resolves.toBeUndefined();
    await expect(service.onModuleDestroy()).resolves.toBeUndefined();
  });

  it('falls back to the default dev database url when DATABASE_URL is unset', () => {
    delete process.env.DATABASE_URL;

    expect(() => new PrismaService()).not.toThrow();
  });
});
