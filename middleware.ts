import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs only for /admin routes (see matcher). Refreshes the auth session and redirects
 * visitors without a session to the login page. Role checks happen again on the server
 * in the admin layout and in every server action.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLogin = path === "/admin/login";

  if (!user && !isLogin) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  // A signed-in account that is not staff is sent to /admin/login?denied=1 by the panel layout.
  // Let it reach the login page (which signs it out) instead of bouncing it back to the dashboard.
  if (user && isLogin && !request.nextUrl.searchParams.has("denied")) {
    const dash = request.nextUrl.clone();
    dash.pathname = "/admin/dashboard";
    dash.search = "";
    return NextResponse.redirect(dash);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
