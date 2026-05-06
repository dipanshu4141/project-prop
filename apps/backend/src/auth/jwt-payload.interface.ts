import { MemberRole, PlatformRole } from '@prisma/client';

/** Shape of data encoded inside every JWT access token. */
export interface JwtPayload {
  sub:          string;        // User.id
  email:        string;
  workspaceId:  string;        // active workspace
  role:         MemberRole;    // workspace-level role
  platformRole: PlatformRole;  // platform-level role (SUPERADMIN | SUPPORT | USER)
}