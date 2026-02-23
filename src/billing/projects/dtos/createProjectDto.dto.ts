import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

 export enum ProjectStatus {
   IN_PROGRESS = 'IN_PROGRESS',
   COMPLETED = 'COMPLETED',
   CANCELLED = 'CANCELLED',
   DRAFT = 'DRAFT',   
   VALIDATED = 'VALIDATED'
    
 }
export class CreateProjectDto {
  @IsUUID()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  description?: string;
}


 