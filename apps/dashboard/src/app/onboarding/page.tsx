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
  const params = await searchParams;
  const status = await getOnboardingStatus();

  if (!status) redirect('/login');

  const startAtPlan = params.step === 'plan';

  if (status.hasWorkspace && !startAtPlan && status.planSelected) {
    redirect('/v2/dashboard');
  }

  return (
    <OnboardingFlow
      initialStep="plan"
      initialWorkspaceType="INDIVIDUAL"
      workspaceName={status.workspaceName ?? ''}
    />
  );
}