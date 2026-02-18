import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CompanyGuard } from '../company.guard';
 

@UseGuards(CompanyGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Body() dto: CreateClientDto, @Req() req) {
    return this.clientsService.create(req.companyId, dto);
  }

  @Get()
  findAll(@Req() req) {
    return this.clientsService.findAll(req.companyId);
  }

  @Get('trash')
  trash(@Req() req) {
    return this.clientsService.trash(req.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.clientsService.findOne(req.companyId, id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClientDto, @Req() req) {
    return this.clientsService.update(req.companyId, id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.clientsService.softDelete(req.companyId, id, req.user?.sub);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string, @Req() req) {
    return this.clientsService.restore(req.companyId, id);
  }
}
