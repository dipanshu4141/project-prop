export const runtime = 'edge';
import { NextRequest } from 'next/server';
import { proxyRequest } from '../../_proxy';

type C = { params: Promise<{ path: string[] }> };
const handler = async (req: NextRequest, { params }: C) =>
  proxyRequest(req, `/api/billing/${(await params).path.join('/')}`);

export const GET    = handler;
export const POST   = handler;