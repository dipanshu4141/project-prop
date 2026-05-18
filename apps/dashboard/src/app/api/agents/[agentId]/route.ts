export const runtime = 'edge';
import { NextRequest } from 'next/server';
import { proxyRequest } from '../../_proxy';

type C = { params: Promise<{ agentId: string }> };
export const GET   = async (req: NextRequest, { params }: C) => proxyRequest(req, `/api/agents/${(await params).agentId}`);
export const PATCH = async (req: NextRequest, { params }: C) => proxyRequest(req, `/api/agents/${(await params).agentId}`);