// apps/backend/src/modules/listings/create-listing.dto.ts

import {
  IsEnum, IsOptional, IsString, IsInt, IsBoolean,
  IsNumber, Min, IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ListingType, PropertyCategory, PropertySubType,
  FurnishingType, AvailabilityStatus,
} from '@prisma/client';

export class CreateListingDto {
  @IsEnum(ListingType)
  listingType!: ListingType;

  @IsOptional()
  @IsEnum(PropertyCategory)
  propertyCategory?: PropertyCategory;

  @IsOptional()
  @IsEnum(PropertySubType)
  propertySubType?: PropertySubType;

  @IsOptional()
  @IsString()
  bhk?: string;               // "1", "2", "3", "4", "5+"

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsString()
  building?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;             // rupees — converted to paise in service

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deposit?: number;           // rupees — converted to paise in service

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  areaSqft?: number;

  @IsOptional()
  @IsEnum(FurnishingType)
  furnishing?: FurnishingType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  floor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  totalFloors?: number;

  @IsOptional()
  @IsBoolean()
  negotiable?: boolean;

  @IsOptional()
  @IsEnum(AvailabilityStatus)
  availability?: AvailabilityStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contacts?: string[];        // phone numbers
}