// apps/dashboard/src/app/api/clients/route.ts
export const runtime = 'edge';
import { NextRequest } from 'next/server';
import { proxyRequest } from '../_proxy';

export const GET  = (req: NextRequest) => proxyRequest(req, '/api/clients');
export const POST = (req: NextRequest) => proxyRequest(req, '/api/clients');