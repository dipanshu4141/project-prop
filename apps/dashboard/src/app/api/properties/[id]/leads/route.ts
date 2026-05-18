export const runtime = 'edge';
import { NextRequest } from 'next/server';
import { proxyRequest } from '../../../_proxy';

type C = { params: Promise<{ id: string }> };
export const GET = async (req: NextRequest, { params }: C) =>
  proxyRequest(req, `/api/properties/${(await params).id}/leads`);