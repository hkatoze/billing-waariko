import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
 

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async findOne(companyId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { project: true },
    });

    if (!invoice) throw new NotFoundException();
    return invoice;
  }

  async softDelete(companyId: string, id: string, userId: string) {
    const invoice = await this.findOne(companyId, id);

    if (
      invoice.project.status === 'VALIDATED' ||
      invoice.project.status === 'COMPLETED'
    ) {
      throw new ForbiddenException('Invoice locked');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  async restore(companyId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, companyId },
    });

    if (!invoice?.deletedAt) throw new NotFoundException();

    const diff =
      (Date.now() - new Date(invoice.deletedAt).getTime()) /
      (1000 * 60 * 60 * 24);

    if (diff > 30) throw new ForbiddenException('Restore expired');

    return this.prisma.invoice.update({
      where: { id },
      data: { deletedAt: null, deletedBy: null },
    });
  }

  async trash(companyId: string) {
    return this.prisma.invoice.findMany({
      where: { companyId, NOT: { deletedAt: null } },
      orderBy: { deletedAt: 'desc' },
    });
  }
}