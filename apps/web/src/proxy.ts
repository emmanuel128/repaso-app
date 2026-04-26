import { NextResponse } from 'next/server';

export function proxy() {
  // TODO: resolver tenant por dominio y validar sesión/membership
  return NextResponse.next();
}

export const config = {
  matcher: ['/student/:path*', '/dashboard']
};
