import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { BillsService } from './bills.service.js';
import { CreateBillDto } from './dto/create-bill.dto.js';
import { GetBillsQueryDto } from './dto/get-bills-query.dto.js';
import type {
  BillResponse,
  PaginatedBillsResponse,
} from './types/bill-response.type.js';

@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  create(@Body() createBillDto: CreateBillDto): Promise<BillResponse> {
    return this.billsService.create(createBillDto);
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  pay(@Param('id') id: string): Promise<BillResponse> {
    return this.billsService.pay(id);
  }

  @Get()
  findAll(@Query() query: GetBillsQueryDto): Promise<PaginatedBillsResponse> {
    return this.billsService.findAll(query);
  }
}
