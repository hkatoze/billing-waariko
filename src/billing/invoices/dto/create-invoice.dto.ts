import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInvoiceItemDto } from './create-invoice-item.dto';
import { InvoiceCategory, SettlementType } from '@prisma/client';

export class CreateInvoiceDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountRate?: number;
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;
  @IsOptional()
  @IsNumber()
  @Min(0)
  paimentModality?: number;
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