import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  // TODO: resolver tenant por dominio y validar sesión/membership
  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*']
};