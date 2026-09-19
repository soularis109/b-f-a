import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { BillsModule } from './bills/bills.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, BillsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
