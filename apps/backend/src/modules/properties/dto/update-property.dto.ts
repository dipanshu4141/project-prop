import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, IsArray, IsBoolean } from 'class-validator';



export enum LeadStage {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  VISIT = 'VISIT',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED = 'CLOSED',
  LOST = 'LOST',
}

export class UpdatePropertyDto {

  
// add these inside the class:
  @IsOptional() @IsString()  listingType?:        string;
  @IsOptional() @IsString()  propertyCategory?:   string;
  @IsOptional() @IsString()  propertySubType?:    string;
  @IsOptional() @IsNumber()  floor?:              number;
  @IsOptional() @IsNumber()  totalFloors?:        number;
  @IsOptional() @IsBoolean() negotiable?:         boolean;
  @IsOptional() @IsString()  urgencyLevel?:       string;
  @IsOptional() @IsString()  country?:            string;
  @IsOptional() @IsString()  city?:               string;
  @IsOptional() @IsString()  area?:               string;
  @IsOptional() @IsArray()   tenantTypes?:        string[];
  @IsOptional() @IsArray()   tenantRestrictions?: string[];
  @IsOptional() @IsString()  notes?:              string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  price?: string;

  @IsOptional()
  @IsString()
  deposit?: string;

  @IsOptional()
  @IsString()
  bhk?: string;

  @IsOptional()
  @IsNumber()
  areaSqft?: number;

  @IsOptional()
  @IsString()
  furnishing?: string;

  @IsOptional()
  @IsString()
  building?: string;

  @IsOptional()
  @IsString()
  firmName?: string;

  @IsOptional()
  @IsString()
  agentName?: string;

  @IsOptional()
  @IsArray()
  contacts?: string[];

  @IsOptional()
  @IsArray()
  agents?: {
    name: string;
    phones: string[];
  }[];

  @IsOptional()
  @IsString()
  senderContact?: string;

  @IsOptional()
  @IsNumber()
  confidence?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  availability?: string;

  // ------------------------
  // 🆕 LEAD CRM FIELDS
  // ------------------------

  @IsOptional()
  @IsEnum(LeadStage)
  leadStage?: LeadStage;

  @IsOptional()
  @IsDateString()
  followUpAt?: string;

  @IsOptional()
  @IsDateString()
  lastContactedAt?: string;
}
