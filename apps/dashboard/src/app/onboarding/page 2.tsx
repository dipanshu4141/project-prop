// apps/dashboard/src/app/onboarding/page.tsx
//
// Reached two ways:
//   A) Fresh registration → ?step=plan&type=INDIVIDUAL|FIRM
//      Workspace already created. Show plan + invite only.
//   B) Direct visit by logged-in user with no workspace
//      Show full flow starting at workspace step.

import { redirect } from 'next/navigation';
import { cookies }  from 'next/headers';
import { OnboardingFlow } from './OnboardingFlow';

const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001';

async function getOnboardingStatus() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return null;
    const res = await fetch(`${BACKEND_URL}/api/onboarding/status`, {
      headers: { cookie: `access_token=${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;          // ← Next.js 15: searchParams is a Promise
  const status = await getOnboardingStatus();

  // Not authenticated at all → login
  if (!status) redirect('/login');

  // Coming from register with ?step=plan — workspace exists, skip to plan
  const startAtPlan   = params.step === 'plan';
  const workspaceType = (params.type as 'INDIVIDUAL' | 'FIRM') ?? 'INDIVIDUAL';

  // Existing user with workspace who visits /onboarding directly
  // and is NOT coming fresh from register → already done, go to dashboard
  if (status.hasWorkspace && !startAtPlan) {
    redirect('/v2/dashboard');
  }

  return (
    <OnboardingFlow
      initialStep={startAtPlan ? 'plan' : 'workspace'}
      initialWorkspaceType={workspaceType}
      workspaceName={status.workspaceName ?? ''}
    />
  );
}