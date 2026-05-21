export const runtime = 'edge';
import { NextRequest } from 'next/server';
import { proxyRequest } from '../../../_proxy';

type C = { params: Promise<{ id: string }> };

export const POST  = async (req: NextRequest, { params }: C) =>
  proxyRequest(req, `/api/clients/${(await params).id}/follow-up`);

export const PATCH = async (req: NextRequest, { params }: C) =>
  proxyRequest(req, `/api/clients/${(await params).id}/follow-up`);