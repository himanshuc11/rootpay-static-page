import { NextRequest, NextResponse } from 'next/server'
import { QUERY_PARAMS } from '@/constants';
import { SECURE_DB_DATA } from './db';
 
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const searchParams = Object.fromEntries(new URL(request.url).searchParams);

  const referer = request.headers.get("referer")
  const refererUrl = referer ? new URL(referer) : null
  const origin = refererUrl?.origin
  const clientData = SECURE_DB_DATA[searchParams[QUERY_PARAMS.CLIENT_ID]];

  const isValidOrigin = clientData?.allowedOrigins?.includes?.(origin ?? "") ?? false;
  const cspHeaderAncestor = isValidOrigin ? origin : "none";

const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors ${cspHeaderAncestor};
    frame-src 'self';
    upgrade-insecure-requests;
`
  // Replace newline characters and spaces
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, ' ')
    .trim()
 
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
 
  requestHeaders.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  )
 
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  response.headers.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  )
 
  return response
}
export const config = {
    matcher: '/:path*',
}
