import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBillDto } from './dto/create-bill.dto.js';
import type { BillResponse } from './types/bill-response.type.js';

@Injectable()
export class BillsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBillDto): Promise<BillResponse> {
    const bill = await this.prisma.bill.create({
      data: {
        id: randomUUID(),
        amount: new Prisma.Decimal(dto.amount),
        payee: dto.payee,
        status: 'unpaid',
      },
    });

    return {
      id: bill.id,
      amount: bill.amount.toNumber(),
      payee: bill.payee,
      status: bill.status,
      createdAt: bill.createdAt,
      updatedAt: bill.updatedAt,
    };
  }
}
