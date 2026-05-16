import { IsOptional, IsString, IsNumber, IsBoolean, IsArray } from 'class-validator';

export class UpdateListingDto {
  @IsOptional() @IsString()  listingType?:        string;
  @IsOptional() @IsString()  propertyCategory?:   string;
  @IsOptional() @IsString()  propertySubType?:    string;
  @IsOptional() @IsString()  bhk?:                string;
  @IsOptional() @IsNumber()  areaSqft?:           number;
  @IsOptional() @IsString()  furnishing?:         string;
  @IsOptional() @IsNumber()  floor?:              number;
  @IsOptional() @IsNumber()  totalFloors?:        number;
  @IsOptional() @IsString()  status?:             string;
  @IsOptional() @IsNumber()  price?:              number;
  @IsOptional() @IsNumber()  deposit?:            number;
  @IsOptional() @IsBoolean() negotiable?:         boolean;
  @IsOptional() @IsString()  urgencyLevel?:       string;
  @IsOptional() @IsString()  availableFrom?:      string;
  @IsOptional() @IsString()  country?:            string;
  @IsOptional() @IsString()  city?:               string;
  @IsOptional() @IsString()  area?:               string;
  @IsOptional() @IsString()  location?:           string;
  @IsOptional() @IsString()  building?:           string;
  @IsOptional() @IsArray()   tenantTypes?:        string[];
  @IsOptional() @IsArray()   tenantRestrictions?: string[];
  @IsOptional() @IsString()  notes?:              string;
}