import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const userType = session?.user?.type;
  const isAgent = session?.user?.isAgent;
  const isPda = session?.user?.isPda;
  const isPatient = session?.user?.isPatient;
  const isOnboarded = session?.user?.onboarded;
  const mustChange = session?.user?.mustChangePassword;

  // isPdaOnly: has PDA relationships but is NOT a patient (no patientAssignment row)
  const isPdaOnly = isPda && !isPatient;

  // These pages are publicly accessible or must not be gated by role redirects
  if (
    nextUrl.pathname.startsWith("/invite/") ||
    nextUrl.pathname.startsWith("/staff-invite/") ||
    nextUrl.pathname === "/suspended"
  ) {
    return NextResponse.next();
  }

  const isAuthPage =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register") ||
    nextUrl.pathname.startsWith("/forgot-password") ||
    nextUrl.pathname.startsWith("/reset-password");

  if (isAuthPage) {
    if (!isLoggedIn) return NextResponse.next();
    if (userType === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', nextUrl));
    if (isAgent) return NextResponse.redirect(new URL('/agent/dashboard', nextUrl));
    // PDA-only users go to the representing workspace; patients (including patient+PDA) go to dashboard
    if (isPdaOnly) return NextResponse.redirect(new URL('/representing', nextUrl));
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
  } else if (isAgent) {
    if (mustChange && !nextUrl.pathname.startsWith('/agent/change-password'))
      return NextResponse.redirect(new URL('/agent/change-password', nextUrl));
    if (!nextUrl.pathname.startsWith('/agent'))
      return NextResponse.redirect(new URL('/agent/dashboard', nextUrl));
  } else {
    // Regular user (patient / PDA / both)
    // Block access to admin and agent areas
    if (nextUrl.pathname.startsWith('/admin') || nextUrl.pathname.startsWith('/agent')) {
      const home = isPdaOnly ? '/representing' : '/dashboard';
      return NextResponse.redirect(new URL(home, nextUrl));
    }

    if (isPdaOnly) {
      // PDA-only users may only access /representing and /account
      if (!nextUrl.pathname.startsWith('/representing') && !nextUrl.pathname.startsWith('/account')) {
        return NextResponse.redirect(new URL('/representing', nextUrl));
      }
    } else {
      // Patient (or patient+PDA) — may access patient routes and /representing
      // Unboarded patients may only access /dashboard or /representing
      if (!isOnboarded &&
          !nextUrl.pathname.startsWith('/dashboard') &&
          !nextUrl.pathname.startsWith('/representing')) {
        return NextResponse.redirect(new URL('/dashboard', nextUrl));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|api/register|api/password/forgot|api/password/reset|api/fax/incoming|api/fax/confirm|api/invites|api/staff-invite|_next/static|_next/image|uploads|favicon.ico).*)"],
};
