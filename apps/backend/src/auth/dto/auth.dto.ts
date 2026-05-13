import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
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

  /** Display name for the workspace — firm name or broker's own name */
  @IsString()
  @IsNotEmpty()
  workspaceName!: string;

  @IsEnum(WorkspaceType)
  workspaceType!: WorkspaceType;  // INDIVIDUAL | FIRM

  @IsString()
  @IsOptional()
  phone?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class TokenResponseDto {
  accessToken!: string;
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