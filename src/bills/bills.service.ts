import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Bill } from '../generated/prisma/client.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBillDto } from './dto/create-bill.dto.js';
import { GetBillsQueryDto } from './dto/get-bills-query.dto.js';
import type {
  BillResponse,
  PaginatedBillsResponse,
} from './types/bill-response.type.js';

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

    return this.toBillResponse(bill);
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

    return this.toBillResponse(paid);
  }

  async findAll(query: GetBillsQueryDto): Promise<PaginatedBillsResponse> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [bills, total] = await this.prisma.$transaction([
      this.prisma.bill.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.bill.count(),
    ]);

    return {
      data: bills.map((bill) => this.toBillResponse(bill)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private toBillResponse(bill: Bill): BillResponse {
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
