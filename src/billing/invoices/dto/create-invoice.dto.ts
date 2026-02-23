import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
  IsArray,
  ValidateNested,
  
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInvoiceItemDto } from './create-invoice-item.dto';
import { InvoiceCategory, SettlementType } from '@prisma/client';

export class CreateInvoiceDto {
  @IsOptional()
  @IsEnum(InvoiceCategory)
  category?: InvoiceCategory;

  @IsOptional()
  @IsEnum(SettlementType)
  settlementType?: SettlementType;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  internalNote?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}