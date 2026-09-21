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
});
