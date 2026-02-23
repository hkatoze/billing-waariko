import { Module } from '@nestjs/common';

import { InvoicesController } from './invoices.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [PrismaModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],

  exports: [InvoicesService, InvoicesController],
})
export class InvoicesModule {}
