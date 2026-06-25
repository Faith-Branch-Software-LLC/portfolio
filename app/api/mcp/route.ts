import { NextRequest, NextResponse } from 'next/server';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createMcpServer } from '@/lib/mcp/server';
import { verifyMcpApiKey } from '@/lib/mcp/auth';

async function handleMcp(req: NextRequest): Promise<Response> {
  const authorized = await verifyMcpApiKey(req);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  const server = createMcpServer();
  await server.connect(transport);
  return transport.handleRequest(req);
}

export const GET = handleMcp;
export const POST = handleMcp;
export const DELETE = handleMcp;
