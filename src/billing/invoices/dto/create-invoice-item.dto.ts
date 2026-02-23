import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateInvoiceItemDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}