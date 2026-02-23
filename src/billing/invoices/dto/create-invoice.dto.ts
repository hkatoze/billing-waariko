import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInvoiceItemDto } from './create-invoice-item.dto';
import { InvoiceType, InvoiceCategory, SettlementType } from '@prisma/client';
import { CreateProjectDto } from 'src/billing/projects/dtos/createProjectDto.dto';
import { CreateClientDto } from 'src/billing/clients/dto/create-client.dto';

export class CreateInvoiceDto {
  @IsOptional()
  @IsEnum(InvoiceType)
  type?: InvoiceType;

  @IsNumber()
  @Min(0)
  total?: number;

  @IsNumber()
  @Min(0)
  subtotal?: number;

  @IsOptional()
  @IsEnum(InvoiceCategory)
  category?: InvoiceCategory;

  // Numérotation auto côté backend
  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(SettlementType)
  settlementType?: SettlementType;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  internalNote?: string;

  @IsOptional()
  @Type(() => CreateProjectDto)
  project?: CreateProjectDto;

  @IsOptional()
  @Type(() => CreateClientDto)
  client?: CreateClientDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}


   