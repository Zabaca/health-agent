import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const userType = session?.user?.type;
  const mustChange = session?.user?.mustChangePassword;

  // Invite pages are publicly accessible (no auth required to view the invite)
  if (nextUrl.pathname.startsWith("/invite/")) {
    return NextResponse.next();
  }

  const isAuthPage =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");

  if (isAuthPage) {
    if (!isLoggedIn) return NextResponse.next();
    if (userType === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', nextUrl));
    if (userType === 'agent') return NextResponse.redirect(new URL('/agent/dashboard', nextUrl));
    if (userType === 'patient_designated_agent') return NextResponse.redirect(new URL('/representing', nextUrl));
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
  } else if (userType === 'patient_designated_agent') {
    if (nextUrl.pathname.startsWith('/admin') || nextUrl.pathname.startsWith('/agent'))
      return NextResponse.redirect(new URL('/representing', nextUrl));
    if (!nextUrl.pathname.startsWith('/representing'))
      return NextResponse.redirect(new URL('/representing', nextUrl));
  } else {
    // TODO: A patient may also be a PDA (if they registered as a patient after being invited as a PDA).
    // In that case, they should also be able to access /representing/* to switch context between their
    // patient area and the patients they represent. Currently, patients are blocked from /representing.
    // This requires checking patientDesignatedAgents at request time — defer until context-switch UI is built.
    if (nextUrl.pathname.startsWith('/admin') || nextUrl.pathname.startsWith('/agent') || nextUrl.pathname.startsWith('/representing'))
      return NextResponse.redirect(new URL('/dashboard', nextUrl));

    // Unboarded patients may only access /dashboard
    if (!session?.user?.onboarded && !nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|api/register|api/fax/incoming|api/fax/confirm|api/invites|_next/static|_next/image|uploads|favicon.ico).*)"],
};
