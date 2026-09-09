// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    // 사용자가 가지고 있는 쿠키에서 admin_session 값을 확인
    const adminSession = request.cookies.get("admin_session");

    // 만약 접근하려는 URL이 /admin이거나 그 하위 경로인데, 로그인을 안 했다면
    if (request.nextUrl.pathname.startsWith("/admin") && !adminSession) {
        // 얄짤없이 /login 페이지
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // 문제없으면 그냥 통과
    return NextResponse.next();
}

// 이 문지기가 감시할 구역을 /admin 관련 모든 경로로 설정
export const config = {
    matcher: [
        "/admin",
        "/admin/:path*"
    ],
};