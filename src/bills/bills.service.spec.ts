import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BillsService } from './bills.service.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('BillsService', () => {
  let service: BillsService;
  const prismaMock = {
    bill: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };

  beforeEach(async () => {
    prismaMock.bill.create.mockReset();
    prismaMock.bill.findUnique.mockReset();
    prismaMock.bill.update.mockReset();
    prismaMock.bill.findMany.mockReset();
    prismaMock.bill.count.mockReset();
    prismaMock.$transaction.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(BillsService);
  });

  it('creates a bill with status "unpaid" and a generated id', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    prismaMock.bill.create.mockResolvedValue({
      id: 'ignored-in-favor-of-call-args',
      amount: new Prisma.Decimal(42.5),
      payee: 'Acme Corp',
      status: 'unpaid',
      createdAt,
      updatedAt: createdAt,
    });

    const result = await service.create({ amount: 42.5, payee: 'Acme Corp' });

    expect(prismaMock.bill.create).toHaveBeenCalledTimes(1);
    const callArgs = prismaMock.bill.create.mock.calls[0]?.[0] as {
      data: {
        id: string;
        amount: Prisma.Decimal;
        payee: string;
        status: string;
      };
    };
    expect(callArgs.data.id).toMatch(UUID_REGEX);
    expect(callArgs.data.payee).toBe('Acme Corp');
    expect(callArgs.data.status).toBe('unpaid');
    expect(callArgs.data.amount.toNumber()).toBe(42.5);

    expect(result.status).toBe('unpaid');
    expect(typeof result.amount).toBe('number');
    expect(result.amount).toBe(42.5);
    expect(result.payee).toBe('Acme Corp');
  });

  describe('pay', () => {
    const id = 'bill-id';
    const createdAt = new Date('2026-01-01T00:00:00.000Z');

    it('transitions an unpaid bill to "paid" and returns the updated bill', async () => {
      prismaMock.bill.findUnique.mockResolvedValue({
        id,
        amount: new Prisma.Decimal(42.5),
        payee: 'Acme Corp',
        status: 'unpaid',
        createdAt,
        updatedAt: createdAt,
      });
      const updatedAt = new Date('2026-01-02T00:00:00.000Z');
      prismaMock.bill.update.mockResolvedValue({
        id,
        amount: new Prisma.Decimal(42.5),
        payee: 'Acme Corp',
        status: 'paid',
        createdAt,
        updatedAt,
      });

      const result = await service.pay(id);

      expect(prismaMock.bill.update).toHaveBeenCalledWith({
        where: { id },
        data: { status: 'paid' },
      });
      expect(result.status).toBe('paid');
      expect(typeof result.amount).toBe('number');
      expect(result.amount).toBe(42.5);
    });

    it('throws NotFoundException when no bill exists for the given id', async () => {
      prismaMock.bill.findUnique.mockResolvedValue(null);

      await expect(service.pay(id)).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.bill.update).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the bill is already paid', async () => {
      prismaMock.bill.findUnique.mockResolvedValue({
        id,
        amount: new Prisma.Decimal(42.5),
        payee: 'Acme Corp',
        status: 'paid',
        createdAt,
        updatedAt: createdAt,
      });

      await expect(service.pay(id)).rejects.toBeInstanceOf(ConflictException);
      expect(prismaMock.bill.update).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');

    it('uses default page/limit to compute skip/take and fixed sort order', async () => {
      prismaMock.bill.findMany.mockResolvedValue([]);
      prismaMock.bill.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20 });

      expect(prismaMock.bill.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('computes skip/take for a non-default page', async () => {
      prismaMock.bill.findMany.mockResolvedValue([]);
      prismaMock.bill.count.mockResolvedValue(25);

      await service.findAll({ page: 3, limit: 10 });

      expect(prismaMock.bill.findMany).toHaveBeenCalledWith({
        skip: 20,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('returns an empty page with totalPages 0 when there are no bills', async () => {
      prismaMock.bill.findMany.mockResolvedValue([]);
      prismaMock.bill.count.mockResolvedValue(0);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual([]);
      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });
    });

    it('maps bills to BillResponse with numeric amount and correct meta', async () => {
      prismaMock.bill.findMany.mockResolvedValue([
        {
          id: 'bill-1',
          amount: new Prisma.Decimal(42.5),
          payee: 'Acme Corp',
          status: 'unpaid',
          createdAt,
          updatedAt: createdAt,
        },
      ]);
      prismaMock.bill.count.mockResolvedValue(25);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(typeof result.data[0]?.amount).toBe('number');
      expect(result.data[0]?.amount).toBe(42.5);
      expect(result.meta).toEqual({
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
      });
    });
  });
});
