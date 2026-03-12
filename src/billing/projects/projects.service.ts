import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dtos/createProjectDto.dto';
import { UpdateProjectDto } from './dtos/updateProjectDto.dto';
import { CreateInvoiceDto } from '../invoices/dto/create-invoice.dto';
import { UpdateInvoiceDto } from '../invoices/dto/update-invoice.dto';
import { Prisma } from '@prisma/client';
 
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
      include: {
        client: true,
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
        client: true,
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
      include: {
        client: true,
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
      include: {
        client: true,
      },
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

  private async generateProformaNumber(
    companyId: string,
    tx: Prisma.TransactionClient,
  ): Promise<{ number: string; reference: string }> {
    const year = new Date().getFullYear();
    // Compte les proformas existantes pour cette company cette année
    const count = await tx.invoice.count({
      where: {
        companyId,
        type: 'PROFORMA',
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });
    const sequence = String(count + 1).padStart(4, '0');
    const number = `${year}-${sequence}`; // ex: 2026-0001
    const reference = `PF-${year}-${sequence}`; // ex: PF-2026-0001
    return { number, reference };
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
      const items = dto.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      }));
      const subtotal = items.reduce((a, b) => a + b.total, 0);
      // Génération du numéro unique
      const { number, reference } = await this.generateProformaNumber(
        companyId,
        tx,
      );
      await tx.invoice.create({
        data: {
          companyId,
          projectId,
          clientId: project.clientId,
          type: 'PROFORMA',
          category: dto.category ?? 'STANDARD',
          number,
          reference,
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
  async updateProforma(
    companyId: string,
    projectId: string,
    invoiceId: string,
    dto: UpdateInvoiceDto,
  ) {
    const project = await this.findOne(companyId, projectId);
    if (project.status !== 'IN_PROGRESS') {
      throw new ForbiddenException(
        'Seule une proforma en cours peut être modifiée',
      );
    }
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        projectId,
        companyId,
        type: 'PROFORMA',
        deletedAt: null,
      },
    });
    if (!invoice) throw new NotFoundException('Proforma introuvable');
    return this.prisma.$transaction(async (tx) => {
      if (dto.items && dto.items.length > 0) {
        // Supprime les anciens items et recrée
        await tx.invoiceItem.deleteMany({ where: { invoiceId } });
        const items = dto.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        }));
        const subtotal = items.reduce((a, b) => a + b.total, 0);
        return tx.invoice.update({
          where: { id: invoiceId },
          data: {
            category: dto.category ?? invoice.category,
            subtotal,
            total: subtotal,
            dueDate: dto.dueDate ? new Date(dto.dueDate) : invoice.dueDate,
            settlementType: dto.settlementType ?? invoice.settlementType,
            notes: dto.notes ?? invoice.notes,
            items: {
              create: items,
            },
          },
        });
      }
      // Mise à jour sans toucher aux items
      return tx.invoice.update({
        where: { id: invoiceId },
        data: {
          category: dto.category ?? invoice.category,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : invoice.dueDate,
          settlementType: dto.settlementType ?? invoice.settlementType,
          notes: dto.notes ?? invoice.notes,
        },
      });
    });
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



