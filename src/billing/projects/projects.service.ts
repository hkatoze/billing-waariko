import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dto/createProjectDto.dto';
import { UpdateProjectDto } from './dto/updateProjectDto.dto';
 
 

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, dto: CreateProjectDto) {
    // Vérifier que le client appartient à la même entreprise
    const client = await this.prisma.client.findFirst({
      where: {
        id: dto.clientId,
        companyId,
        deletedAt: null,
      },
    });

    if (!client) throw new NotFoundException('Client not found');

    return this.prisma.project.create({
      data: {
        companyId,
        clientId: dto.clientId,
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.project.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  async findByClient(companyId: string, clientId: string) {
    // Vérifier que le client appartient à l’entreprise
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        companyId,
        deletedAt: null,
      },
    });

    if (!client) throw new NotFoundException('Client not found');

    return this.prisma.project.findMany({
      where: {
        companyId,
        clientId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  async findOne(companyId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      include: {
        client: true,
        invoices: true,
      },
    });

    if (!project) throw new NotFoundException('Project not found');

    return project;
  }

  async update(companyId: string, id: string, dto: UpdateProjectDto) {
    await this.findOne(companyId, id);

    return this.prisma.project.update({
      where: { id },
      data: dto,
    });
  }

  async softDelete(companyId: string, id: string, userId: string) {
    const project = await this.findOne(companyId, id);

    // Empêcher suppression si facture VALIDATED
    const validatedInvoice = await this.prisma.invoice.findFirst({
      where: {
        projectId: id,
        status: { in: ['VALIDATED', 'PAID'] },
      },
    });

    if (validatedInvoice) {
      throw new ForbiddenException(
        'Cannot delete project with validated invoices',
      );
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  async restore(companyId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, companyId },
    });

    if (!project || !project.deletedAt)
      throw new NotFoundException('Project not deleted');

    const diff =
      (Date.now() - new Date(project.deletedAt).getTime()) /
      (1000 * 60 * 60 * 24);

    if (diff > 30) throw new ForbiddenException('Restore period expired');

    return this.prisma.project.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    });
  }

  async trash(companyId: string) {
    return this.prisma.project.findMany({
      where: {
        companyId,
        NOT: { deletedAt: null },
      },
      orderBy: { deletedAt: 'desc' },
    });
  }
}