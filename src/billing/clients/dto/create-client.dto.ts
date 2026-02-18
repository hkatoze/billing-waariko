import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";


 export enum ClientType {
   COMPANY = 'COMPANY',
   INDIVIDUAL = 'INDIVIDUAL',
 }

 export class CreateClientDto {
   @IsEnum(ClientType)
   type: ClientType;

   @IsString()
   @IsNotEmpty()
   name: string;

   @IsString()
   countryCode: string;

   @IsOptional()
   @IsString()
   sector?: string;

   @IsOptional()
   @IsEmail()
   email?: string;

   @IsOptional()
   @IsString()
   phone?: string;

   @IsOptional()
   @IsString()
   address?: string;
 }
