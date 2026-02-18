import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, dto: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        ...dto,
        companyId,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.client.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!client) throw new NotFoundException('Client not found');

    return client;
  }

  async update(companyId: string, id: string, dto: UpdateClientDto) {
    await this.findOne(companyId, id);

    return this.prisma.client.update({
      where: { id },
      data: dto,
    });
  }

  async softDelete(companyId: string, id: string, userId: string) {
    const client = await this.findOne(companyId, id);

    return this.prisma.client.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  async restore(companyId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, companyId },
    });

    if (!client || !client.deletedAt)
      throw new NotFoundException('Client not deleted');

    const diff =
      (Date.now() - new Date(client.deletedAt).getTime()) /
      (1000 * 60 * 60 * 24);

    if (diff > 30) throw new ForbiddenException('Restore period expired');

    return this.prisma.client.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    });
  }

  async trash(companyId: string) {
    return this.prisma.client.findMany({
      where: {
        companyId,
        NOT: { deletedAt: null },
      },
      orderBy: { deletedAt: 'desc' },
    });
  }
}
