// app/api/views/route.ts

import { NextResponse } from "next/server";
import { supabase } from "../../../src/lib/supabase";
import { getValidChannel } from "@/readonly";

// CORS, 프리플라이트 처리
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
        const { campaign_id, channel, session_id } = body;

        if (!campaign_id || !session_id) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
            );
        }

        // 채널 검증
        const validChannel = getValidChannel(channel);

        if (!validChannel) {
            return NextResponse.json(
                { error: "Invalid channel" },
                { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
            );
        }

        // 방문 기록 저장
        const { error } = await supabase
            .from("campaign_views")
            .insert([
                {
                    campaign_id: campaign_id,
                    channel: validChannel,
                    session_id: session_id,
                },
            ]);

        if (error) throw error;

        return NextResponse.json(
            { success: true },
            { headers: { "Access-Control-Allow-Origin": "*" } }
        );
    }
    catch (error) {
        console.error("View tracking error:", error);

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
        );
    }
}