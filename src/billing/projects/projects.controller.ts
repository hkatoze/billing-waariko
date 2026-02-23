import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CompanyGuard } from '../company.guard';
 
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dtos/createProjectDto.dto';
import { UpdateProjectDto } from './dtos/updateProjectDto.dto';
import { CreateInvoiceDto } from '../invoices/dto/create-invoice.dto';
 
 
 

@UseGuards(CompanyGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() dto: CreateProjectDto, @Req() req) {
    return this.projectsService.create(req.companyId, dto);
  }

  @Get()
  findAll(@Req() req, @Query('clientId') clientId?: string) {
    if (clientId) {
      return this.projectsService.findByClient(req.companyId, clientId);
    }

    return this.projectsService.findAll(req.companyId);
  }

  @Get(':clientId/projects')
  getClientProjects(@Param('clientId') clientId: string, @Req() req) {
    return this.projectsService.findByClient(req.companyId, clientId);
  }
  @Get('trash')
  trash(@Req() req) {
    return this.projectsService.trash(req.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.projectsService.findOne(req.companyId, id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto, @Req() req) {
    return this.projectsService.update(req.companyId, id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.projectsService.softDelete(req.companyId, id, req.user?.sub);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string, @Req() req) {
    return this.projectsService.restore(req.companyId, id);
  }

  // CREATE PROFORMA
  @Post(':id/proforma')
  createProforma(
    @Param('id') id: string,
    @Body() dto: CreateInvoiceDto,
    @Req() req,
  ) {
    return this.projectsService.createProforma(req.companyId, id, dto);
  }

  // VALIDATE PROJECT
  @Post(':id/validate')
  validate(@Param('id') id: string, @Req() req) {
    return this.projectsService.validate(req.companyId, id);
  }

  // MARK PAID
  @Post(':id/mark-paid')
  markPaid(@Param('id') id: string, @Req() req) {
    return this.projectsService.markPaid(req.companyId, id);
  }

  // GET PROJECT INVOICES
  @Get(':id/invoices')
  getInvoices(@Param('id') id: string, @Req() req) {
    return this.projectsService.getInvoices(req.companyId, id);
  }
}