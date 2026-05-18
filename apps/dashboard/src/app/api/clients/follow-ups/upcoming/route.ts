export const runtime = 'edge';
import { NextRequest } from 'next/server';
import { proxyRequest } from '../../../_proxy';

export const GET = (req: NextRequest) => proxyRequest(req, '/api/clients/follow-ups/upcoming');