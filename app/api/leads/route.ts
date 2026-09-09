// app/api/leads/route.ts

import { NextResponse } from "next/server";
import { supabase } from "../../../src/lib/supabase";
import { getValidChannel } from "@/readonly";

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { campaign_id, channel, name, phone, email } = body;

        if (!campaign_id || !name || !phone || !email) {
            return NextResponse.json(
                { error: "필수 정보가 누락되었습니다." },
                { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
            );
        }

        // 하이픈, 공백, 한글 등 날리기
        const numericPhone = phone.replace(/[^0-9]/g, "");

        if (name.length > 20) {
            return NextResponse.json({ error: "이름은 최대 20자까지만 입력 가능합니다." }, { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });
        }
        if (numericPhone.length === 0 || numericPhone.length < 8) {
            return NextResponse.json({ error: "올바른 연락처(숫자)를 입력해주세요." }, { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });
        }
        if (numericPhone.length > 20) {
            return NextResponse.json({ error: "연락처는 최대 20자리 숫자까지만 입력 가능합니다." }, { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });
        }
        if (email.length > 50) {
            return NextResponse.json({ error: "이메일은 최대 50자까지만 입력 가능합니다." }, { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });
        }

        const validChannel = getValidChannel(channel);
        if (!validChannel) {
            return NextResponse.json(
                { error: "유효하지 않은 채널입니다." },
                { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
            );
        }

        // 동일 캠페인 내 연락처 또는 이메일 중복 신청 체크
        const { data: existingLead, error: checkError } = await supabase
            .from("leads")
            .select("id")
            .eq("campaign_id", campaign_id)
            .or(`phone.eq.${numericPhone},email.eq.${email}`)
            .maybeSingle();

        if (checkError) {
            console.error("Duplicate check error:", checkError);
        }

        if (existingLead) {
            return NextResponse.json(
                { error: "이미 해당 연락처 또는 이메일로 신청이 완료된 캠페인입니다." },
                { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
            );
        }

        const { error } = await supabase
            .from("leads")
            .insert([{ campaign_id, channel: validChannel, name, phone: numericPhone, email }]);

        if (error) throw error;

        return NextResponse.json({ success: true }, { headers: { "Access-Control-Allow-Origin": "*" } });
    } catch (error) {
        console.error("Lead submission error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
    }
}