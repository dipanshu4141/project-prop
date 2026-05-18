export const runtime = 'edge';
import { NextRequest } from 'next/server';
import { proxyRequest } from '../../_proxy';

export const POST = (req: NextRequest) => proxyRequest(req, '/api/clients/share-token-by-phone');