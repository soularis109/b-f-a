import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async pay(id: string): Promise<BillResponse> {
    const bill = await this.prisma.bill.findUnique({ where: { id } });

    if (!bill) {
      throw new NotFoundException(`Bill with id "${id}" not found`);
    }
    if (bill.status === 'paid') {
      throw new ConflictException(`Bill with id "${id}" is already paid`);
    }

    const paid = await this.prisma.bill.update({
      where: { id },
      data: { status: 'paid' },
    });

    return {
      id: paid.id,
      amount: paid.amount.toNumber(),
      payee: paid.payee,
      status: paid.status,
      createdAt: paid.createdAt,
      updatedAt: paid.updatedAt,
    };
  }
}
