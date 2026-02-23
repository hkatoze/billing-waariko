import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dtos/createProjectDto.dto';
import { UpdateProjectDto } from './dtos/updateProjectDto.dto';
import { CreateInvoiceDto } from '../invoices/dto/create-invoice.dto';
 
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
        ...dto,
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
    const validatedInvoice = await this.prisma.project.findFirst({
      where: {
        id: id,
        status: { in: ['VALIDATED', 'COMPLETED'] },
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

  async createProforma(
    companyId: string,
    projectId: string,
    dto: CreateInvoiceDto,
  ) {
    const project = await this.findOne(companyId, projectId);

    if (project.status !== 'DRAFT') {
      throw new ForbiddenException('Invalid project state');
    }

    await this.prisma.$transaction(async (tx) => {
      // 🔹 Calcul des items
      const items = dto.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      }));

      const subtotal = items.reduce((a, b) => a + b.total, 0);

      await tx.invoice.create({
        data: {
          companyId,
          projectId,
          clientId: project.clientId, 
          type: 'PROFORMA',
          category: dto.category ?? 'STANDARD',
          subtotal,
          total: subtotal,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          settlementType: dto.settlementType,
          notes: dto.notes,
          internalNote: dto.internalNote,
          items: {
            create: items,
          },
        },
      });

      await tx.project.update({
        where: { id: projectId },
        data: { status: 'IN_PROGRESS' },
      });
    });

    return { message: 'Proforma created' };
  }

  async validate(companyId: string, id: string) {
    const project = await this.findOne(companyId, id);

    if (project.status !== 'IN_PROGRESS')
      throw new ForbiddenException('Invalid state');

    await this.prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: { status: 'VALIDATED' },
      });

      await tx.invoice.create({
        data: {
          companyId,
          clientId: project.clientId,
          projectId: id,
          type: 'FINALL',
        },
      });

      await tx.invoice.create({
        data: {
          companyId,
          clientId: project.clientId,
          projectId: id,
          type: 'DELIVERY_NOTE',
          subtotal: 0,
          total: 0,
        },
      });
    });

    return { message: 'Project validated' };
  }

  async markPaid(companyId: string, id: string) {
    const project = await this.findOne(companyId, id);

    if (project.status !== 'VALIDATED')
      throw new ForbiddenException('Invalid state');

    return this.prisma.project.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
  }

  async getInvoices(companyId: string, id: string) {
    return this.prisma.invoice.findMany({
      where: { companyId, projectId: id, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }
}



