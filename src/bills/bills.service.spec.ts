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
    },
  };

  beforeEach(async () => {
    prismaMock.bill.create.mockReset();
    prismaMock.bill.findUnique.mockReset();
    prismaMock.bill.update.mockReset();

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
});
