// /**
//  * apps/backend/prisma/seed.ts
//  *
//  * Run with: npx prisma db seed
//  *
//  * Creates:
//  *   - 1 SUPERADMIN user (you)
//  *   - 1 INDIVIDUAL workspace for your personal dev/testing
//  *   - 1 FIRM workspace to test multi-broker flows
//  */

// import 'dotenv/config';
// import { PrismaClient, PlatformRole, WorkspaceType, MemberRole } from '@prisma/client';
// import * as bcrypt from 'bcrypt';

// const prisma = new PrismaClient({
//   datasourceUrl: process.env.DATABASE_URL!,
// });

// async function main() {
//   console.log('🌱 Seeding database...');

//   /* ── 1. SUPERADMIN user (you) ── */
//   const passwordHash = await bcrypt.hash('devpassword123', 12);

//   const superAdmin = await prisma.user.upsert({
//     where:  { email: 'admin@propertycrm.dev' },
//     update: {},
//     create: {
//       email:         'admin@propertycrm.dev',
//       passwordHash,
//       name:          'Admin (You)',
//       platformRole:  PlatformRole.SUPERADMIN,
//       emailVerified: true,
//     },
//   });
//   console.log('✅ SuperAdmin user:', superAdmin.email);

//   /* ── 2. INDIVIDUAL workspace ── */
//   const individualWs = await prisma.workspace.upsert({
//     where:  { slug: 'dev-individual' },
//     update: {},
//     create: {
//       name: 'Dev Individual',
//       slug: 'dev-individual',
//       type: WorkspaceType.INDIVIDUAL,
//       plan: 'FREE',
//     },
//   });

//   await prisma.workspaceMember.upsert({
//     where: {
//       workspaceId_userId: {
//         workspaceId: individualWs.id,
//         userId:      superAdmin.id,
//       },
//     },
//     update: {},
//     create: {
//       workspaceId: individualWs.id,
//       userId:      superAdmin.id,
//       role:        MemberRole.OWNER,
//     },
//   });

//   await prisma.subscription.upsert({
//     where:  { workspaceId: individualWs.id },
//     update: {},
//     create: {
//       workspaceId:  individualWs.id,
//       plan:         'FREE',
//       status:       'TRIALING',
//       seats:        1,
//       seatsUsed:    1,
//       trialEndsAt:  new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
//     },
//   });

//   console.log('✅ Individual workspace:', individualWs.id);

//   /* ── 3. FIRM workspace (for testing multi-broker) ── */
//   const firmWs = await prisma.workspace.upsert({
//     where:  { slug: 'dev-firm' },
//     update: {},
//     create: {
//       name: 'Dev Firm',
//       slug: 'dev-firm',
//       type: WorkspaceType.FIRM,
//       plan: 'FREE',
//     },
//   });

//   await prisma.workspaceMember.upsert({
//     where: {
//       workspaceId_userId: {
//         workspaceId: firmWs.id,
//         userId:      superAdmin.id,
//       },
//     },
//     update: {},
//     create: {
//       workspaceId: firmWs.id,
//       userId:      superAdmin.id,
//       role:        MemberRole.OWNER,
//     },
//   });

//   await prisma.subscription.upsert({
//     where:  { workspaceId: firmWs.id },
//     update: {},
//     create: {
//       workspaceId:  firmWs.id,
//       plan:         'FREE',
//       status:       'TRIALING',
//       seats:        5,
//       seatsUsed:    1,
//       trialEndsAt:  new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
//     },
//   });

//   console.log('✅ Firm workspace:', firmWs.id);

//   /* ── Print summary ── */
//   console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
//   console.log('🎉 Seed complete! Add this to your .env:');
//   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
//   console.log(`DEFAULT_WORKSPACE_ID=${individualWs.id}`);
//   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
//   console.log('\nLogin at http://localhost:3001/login with:');
//   console.log('  Email:    admin@propertycrm.dev');
//   console.log('  Password: devpassword123');
// }

// main()
//   .catch((e) => { console.error(e); process.exit(1); })
//   .finally(() => prisma.$disconnect());