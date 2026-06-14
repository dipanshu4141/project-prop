import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { WorkspaceType } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72)
  password!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  workspaceName!: string;

  @IsEnum(WorkspaceType)
  workspaceType!: WorkspaceType;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit Indian mobile number' })
  phone!: string; // now required, not optional
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class TokenResponseDto {
  accessToken!:  string;
  refreshToken!: string;
  isNewUser?:    boolean;
  planSelected?: boolean;
  user!: {
    id:           string;
    email:        string;
    name:         string | null;
    platformRole: string;
  };
  workspace!: {
    id:           string;
    name:         string;
    slug:         string;
    type:         string;
    role:         string;
    planSelected: boolean;
  };
}