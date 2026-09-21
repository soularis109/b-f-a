import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { configureApp } from './../src/setup-app.js';

describe('BillsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterEach(async () => {
    await prisma.bill.deleteMany();
    await app.close();
  });

  it('creates an unpaid bill (POST /bills)', async () => {
    const response = await request(app.getHttpServer())
      .post('/bills')
      .send({ amount: 42.5, payee: 'Acme Corp' })
      .expect(201);

    expect(response.body).toMatchObject({
      payee: 'Acme Corp',
      amount: 42.5,
      status: 'unpaid',
    });
    expect(typeof response.body.id).toBe('string');

    const stored = await prisma.bill.findUnique({
      where: { id: response.body.id as string },
    });
    expect(stored?.status).toBe('unpaid');
  });

  it('rejects a non-positive amount', () => {
    return request(app.getHttpServer())
      .post('/bills')
      .send({ amount: 0, payee: 'Acme Corp' })
      .expect(400);
  });

  it('rejects a negative amount', () => {
    return request(app.getHttpServer())
      .post('/bills')
      .send({ amount: -5, payee: 'Acme Corp' })
      .expect(400);
  });

  it('rejects a missing payee', () => {
    return request(app.getHttpServer())
      .post('/bills')
      .send({ amount: 10 })
      .expect(400);
  });

  it('rejects an empty payee', () => {
    return request(app.getHttpServer())
      .post('/bills')
      .send({ amount: 10, payee: '' })
      .expect(400);
  });

  it('rejects payloads with unexpected fields', () => {
    return request(app.getHttpServer())
      .post('/bills')
      .send({ amount: 10, payee: 'Acme', extra: 'nope' })
      .expect(400);
  });

  it('pays an unpaid bill (POST /bills/:id/pay)', async () => {
    const created = await request(app.getHttpServer())
      .post('/bills')
      .send({ amount: 42.5, payee: 'Acme Corp' })
      .expect(201);
    const id = created.body.id as string;

    const response = await request(app.getHttpServer())
      .post(`/bills/${id}/pay`)
      .expect(200);

    expect(response.body).toMatchObject({ id, status: 'paid' });

    const stored = await prisma.bill.findUnique({ where: { id } });
    expect(stored?.status).toBe('paid');
    expect(stored?.updatedAt.getTime()).toBeGreaterThanOrEqual(
      stored!.createdAt.getTime(),
    );
  });

  it('rejects paying an already-paid bill', async () => {
    const created = await request(app.getHttpServer())
      .post('/bills')
      .send({ amount: 42.5, payee: 'Acme Corp' })
      .expect(201);
    const id = created.body.id as string;

    await request(app.getHttpServer()).post(`/bills/${id}/pay`).expect(200);

    await request(app.getHttpServer()).post(`/bills/${id}/pay`).expect(409);
  });

  it('returns 404 when paying a non-existent bill', () => {
    return request(app.getHttpServer())
      .post('/bills/00000000-0000-0000-0000-000000000000/pay')
      .expect(404);
  });

  describe('GET /bills', () => {
    async function createBill(payee: string, amount = 10) {
      const response = await request(app.getHttpServer())
        .post('/bills')
        .send({ amount, payee })
        .expect(201);
      // Ensure distinct createdAt timestamps for deterministic ordering.
      await new Promise((resolve) => setTimeout(resolve, 5));
      return response.body as { id: string };
    }

    it('returns an empty page when there are no bills', async () => {
      const response = await request(app.getHttpServer())
        .get('/bills')
        .expect(200);

      expect(response.body).toEqual({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });
    });

    it('returns bills with default pagination', async () => {
      await createBill('Acme Corp 1');
      await createBill('Acme Corp 2');

      const response = await request(app.getHttpServer())
        .get('/bills')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta).toMatchObject({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
      for (const bill of response.body.data) {
        expect(typeof bill.id).toBe('string');
        expect(typeof bill.amount).toBe('number');
        expect(typeof bill.payee).toBe('string');
      }
    });

    it('paginates across multiple pages', async () => {
      for (let i = 1; i <= 5; i += 1) {
        await createBill(`Bill ${i}`);
      }

      const page1 = await request(app.getHttpServer())
        .get('/bills?page=1&limit=2')
        .expect(200);
      expect(page1.body.data).toHaveLength(2);
      expect(page1.body.meta).toEqual({
        total: 5,
        page: 1,
        limit: 2,
        totalPages: 3,
      });

      const page3 = await request(app.getHttpServer())
        .get('/bills?page=3&limit=2')
        .expect(200);
      expect(page3.body.data).toHaveLength(1);
      expect(page3.body.meta).toEqual({
        total: 5,
        page: 3,
        limit: 2,
        totalPages: 3,
      });
    });

    it('sorts bills by createdAt descending', async () => {
      await createBill('First');
      await createBill('Second');
      await createBill('Third');

      const response = await request(app.getHttpServer())
        .get('/bills')
        .expect(200);

      expect(
        response.body.data.map((bill: { payee: string }) => bill.payee),
      ).toEqual(['Third', 'Second', 'First']);
    });

    it.each([
      ['page', '0'],
      ['page', '-1'],
      ['page', 'abc'],
      ['page', '1.5'],
      ['limit', '0'],
      ['limit', '101'],
      ['limit', 'abc'],
      ['limit', '1.5'],
    ])('rejects an invalid %s value (%s)', async (param, value) => {
      await request(app.getHttpServer())
        .get(`/bills?${param}=${value}`)
        .expect(400);
    });

    it('rejects unexpected query parameters', () => {
      return request(app.getHttpServer()).get('/bills?foo=bar').expect(400);
    });
  });
});
