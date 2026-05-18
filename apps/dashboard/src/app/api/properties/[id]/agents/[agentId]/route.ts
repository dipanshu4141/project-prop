export const runtime = 'edge';
import { NextRequest } from 'next/server';
import { proxyRequest } from '../../../../_proxy';

type C = { params: Promise<{ id: string; agentId: string }> };
export const DELETE = async (req: NextRequest, { params }: C) => {
  const { id, agentId } = await params;
  return proxyRequest(req, `/api/properties/${id}/agents/${agentId}`);
};