import { IsString, IsEnum, IsBoolean, IsOptional, IsNumber } from 'class-validator';

export enum MediaTypeDto {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
}

export class RequestPresignedUrlDto {
  @IsString()
  listingId!: string;

  @IsEnum(MediaTypeDto)
  type!: MediaTypeDto;

  @IsString()
  mimeType!: string; // "image/jpeg", "video/mp4"

  @IsNumber()
  sizeBytes!: number; // frontend sends file.size before upload

  @IsBoolean()
  @IsOptional()
  isCompressed?: boolean;
}

export class ConfirmUploadDto {
  @IsString()
  r2Key!: string;

  @IsString()
  listingId!: string;

  @IsEnum(MediaTypeDto)
  type!: MediaTypeDto;

  @IsString()
  mimeType!: string;

  @IsNumber()
  sizeBytes!: number;

  @IsBoolean()
  @IsOptional()
  isCompressed?: boolean;
}

export class ShareTocommunityDto {
  @IsString()
  mediaId!: string;

  @IsString()
  canonicalPropertyId!: string;
}