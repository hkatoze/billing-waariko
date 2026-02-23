import {
  Controller,
  Get,
  Delete,
  Post,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CompanyGuard } from '../company.guard';
 

@UseGuards(CompanyGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  // GET ONE
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.invoicesService.findOne(req.companyId, id);
  }

  // DELETE (soft)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.invoicesService.softDelete(req.companyId, id, req.user.sub);
  }

  // RESTORE
  @Post(':id/restore')
  restore(@Param('id') id: string, @Req() req) {
    return this.invoicesService.restore(req.companyId, id);
  }

  // TRASH
  @Get('trash')
  trash(@Req() req) {
    return this.invoicesService.trash(req.companyId);
  }
}
