import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Auth.js routes must always be publicly accessible
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");

  // All other /api/* routes require an authenticated session
  const isProtectedApiRoute = nextUrl.pathname.startsWith("/api/") && !isApiAuthRoute;

  // Public page routes (no session required)
  const isPublicRoute = ["/login"].includes(nextUrl.pathname);

  // Always allow Auth.js routes through
  if (isApiAuthRoute) return;

  // Protected API routes: return 401 JSON (don't redirect — these are fetch calls)
  if (isProtectedApiRoute) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return;
  }

  // Public page routes: redirect logged-in users away from /login
  if (isPublicRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/", nextUrl));
    }
    return;
  }

  // All other page routes: require session, redirect to /login if missing
  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl));
  }
})

export const config = {
  // Match everything except static assets & image optimization
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.png|logos).*)"],
}
