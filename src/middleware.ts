import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const userType = session?.user?.type;
  const mustChange = session?.user?.mustChangePassword;

  const isAuthPage =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");

  if (isAuthPage) {
    if (!isLoggedIn) return NextResponse.next();
    if (userType === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', nextUrl));
    if (userType === 'agent') return NextResponse.redirect(new URL('/agent/dashboard', nextUrl));
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  if (!isLoggedIn) {
    if (nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  // API routes handle their own auth — don't apply page-level redirects
  if (nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (userType === 'admin') {
    if (mustChange && !nextUrl.pathname.startsWith('/admin/change-password'))
      return NextResponse.redirect(new URL('/admin/change-password', nextUrl));
    if (!nextUrl.pathname.startsWith('/admin'))
      return NextResponse.redirect(new URL('/admin/dashboard', nextUrl));
  } else if (userType === 'agent') {
    if (mustChange && !nextUrl.pathname.startsWith('/agent/change-password'))
      return NextResponse.redirect(new URL('/agent/change-password', nextUrl));
    if (!nextUrl.pathname.startsWith('/agent'))
      return NextResponse.redirect(new URL('/agent/dashboard', nextUrl));
  } else {
    if (nextUrl.pathname.startsWith('/admin') || nextUrl.pathname.startsWith('/agent'))
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|api/register|_next/static|_next/image|uploads|favicon.ico).*)"],
};
