import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CompanyGuard } from '../company.guard';
 
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/createProjectDto.dto';
import { UpdateProjectDto } from './dto/updateProjectDto.dto';

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
    return this.projectsService.softDelete(req.companyId, id, req.user.sub);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string, @Req() req) {
    return this.projectsService.restore(req.companyId, id);
  }
}