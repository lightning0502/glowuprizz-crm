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

        const numericPhone = phone.replace(/[^0-9]/g, "");
        const cleanEmail = email.trim().toLowerCase();

        if (name.length > 20) {
            return NextResponse.json({ error: "이름은 최대 20자까지만 입력 가능합니다." }, { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });
        }
        if (numericPhone.length === 0 || numericPhone.length < 8) {
            return NextResponse.json({ error: "올바른 연락처(숫자)를 입력해주세요." }, { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });
        }
        if (numericPhone.length > 20) {
            return NextResponse.json({ error: "연락처는 최대 20자리 숫자까지만 입력 가능합니다." }, { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });
        }
        if (cleanEmail.length > 50) {
            return NextResponse.json({ error: "이메일은 최대 50자까지만 입력 가능합니다." }, { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });
        }

        const validChannel = getValidChannel(channel);
        if (!validChannel) {
            return NextResponse.json(
                { error: "유효하지 않은 채널입니다." },
                { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
            );
        }

        // 전화번호 중복 조회
        const { data: phoneLeads, error: phoneError } = await supabase
            .from("leads")
            .select("id")
            .eq("campaign_id", campaign_id)
            .eq("phone", numericPhone);

        if (phoneError) {
            console.error("Phone duplicate check error:", phoneError);
        }

        // 이메일 중복 조회
        const { data: emailLeads, error: emailError } = await supabase
            .from("leads")
            .select("id")
            .eq("campaign_id", campaign_id)
            .eq("email", cleanEmail);

        if (emailError) {
            console.error("Email duplicate check error:", emailError);
        }

        // 둘 중 하나라도 존재하면 NG
        if ((phoneLeads && phoneLeads.length > 0) || (emailLeads && emailLeads.length > 0)) {
            return NextResponse.json(
                { error: "이미 해당 연락처 또는 이메일로 신청이 완료된 캠페인입니다." },
                { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
            );
        }

        // 정상 인서트, OK PASS!
        const { error } = await supabase
            .from("leads")
            .insert([{ campaign_id, channel: validChannel, name, phone: numericPhone, email: cleanEmail }]);

        if (error) throw error;

        return NextResponse.json({ success: true }, { headers: { "Access-Control-Allow-Origin": "*" } });
    } catch (error) {
        console.error("Lead submission error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
    }
}