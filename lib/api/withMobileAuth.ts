import { NextRequest, NextResponse } from 'next/server';
import { verifyMobileAuth } from './verifyMobileAuth';

type MobileAdmin = { id: string; email: string };

type Handler<Ctx> = (req: NextRequest, ctx: Ctx, admin: MobileAdmin) => Promise<Response>;

export function withMobileAuth<Ctx = unknown>(handler: Handler<Ctx>) {
  return async (req: NextRequest, ctx: Ctx): Promise<Response> => {
    const admin = await verifyMobileAuth(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(req, ctx, admin);
  };
}
