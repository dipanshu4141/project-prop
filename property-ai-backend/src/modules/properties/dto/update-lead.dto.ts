import { LeadStage } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateLeadDto {
  @IsOptional()
  @IsEnum(LeadStage)
  leadStage?: LeadStage;

  @IsOptional()
  @IsDateString()
  followUpAt?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
