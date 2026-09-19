import { Body, Controller, Post } from '@nestjs/common';
import { BillsService } from './bills.service.js';
import { CreateBillDto } from './dto/create-bill.dto.js';
import type { BillResponse } from './types/bill-response.type.js';

@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  create(@Body() createBillDto: CreateBillDto): Promise<BillResponse> {
    return this.billsService.create(createBillDto);
  }
}
