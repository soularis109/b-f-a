import { Test, TestingModule } from '@nestjs/testing';
import { BillsController } from './bills.controller.js';
import { BillsService } from './bills.service.js';
import type { BillResponse } from './types/bill-response.type.js';

describe('BillsController', () => {
  let controller: BillsController;
  const billsServiceMock = {
    create: vi.fn(),
    pay: vi.fn(),
  };

  beforeEach(async () => {
    billsServiceMock.create.mockReset();
    billsServiceMock.pay.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillsController],
      providers: [{ provide: BillsService, useValue: billsServiceMock }],
    }).compile();

    controller = module.get(BillsController);
  });

  it('delegates bill creation to BillsService and returns its result', async () => {
    const dto = { amount: 10, payee: 'Acme' };
    const expected: BillResponse = {
      id: 'some-id',
      amount: 10,
      payee: 'Acme',
      status: 'unpaid',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    billsServiceMock.create.mockResolvedValue(expected);

    const result = await controller.create(dto);

    expect(billsServiceMock.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });

  it('delegates bill payment to BillsService and returns its result', async () => {
    const expected: BillResponse = {
      id: 'some-id',
      amount: 10,
      payee: 'Acme',
      status: 'paid',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    billsServiceMock.pay.mockResolvedValue(expected);

    const result = await controller.pay('some-id');

    expect(billsServiceMock.pay).toHaveBeenCalledWith('some-id');
    expect(result).toBe(expected);
  });
});
