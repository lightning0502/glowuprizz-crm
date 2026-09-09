// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { supabase } from "../../../../src/lib/supabase";
import { cookies } from 'next/headers';

export async function POST(request : Request) {
    try {
        const { username, password } = await request.json();

        // Supabase에서 해당 아이디와 일치하는 유저 찾기
        const { data: adminUser, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('username', username)
            .single(); // 아이디는 고유(Unique)하므로 단일 데이터만

        // 유저가 없거나 에러가 발생한 경우
        if (error || !adminUser) {
            return NextResponse.json({ error: "아이디가 존재하지 않습니다." }, { status : 401 });
        }

        // 비밀번호 비교 (과제용이므로 평문 비교. 실무에서는 bcrypt.compare 사용)
        if (adminUser.password !== password) {
            return NextResponse.json({ error: "비밀번호가 일치하지 않습니다." }, { status : 401 });
        }

        // 인증 성공, Next.js 쿠키에 인증 토큰 저장 (브라우저에서 접근 못하게 httpOnly 설정)
        (await cookies()).set('admin_session', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 24시간 유지
            path: '/',
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: ("오류 발생 : " + error) }, { status : 500 });
    }
}