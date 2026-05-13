import { MemberRole, PlatformRole } from '@prisma/client';


export interface JwtPayload {
  sub:           string;
  email:         string;
  workspaceId:   string;
  role:          string;
  platformRole:  string;
  planSelected?:  boolean;
}