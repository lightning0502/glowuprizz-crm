// app/api/form/[id]/route.ts

import { NextResponse } from "next/server";
import { supabase } from "../../../../src/lib/supabase";

export async function GET( request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // 캠페인 정보 조회
        const { data: campaign, error } = await supabase
            .from("campaigns")
            .select("html_file_path")
            .eq("id", id)
            .single();

        if (error || !campaign) {
            return new NextResponse("Campaign not found", { status: 404 });
        }

        // Storage에 HTML 가져오기
        const storageRes = await fetch(campaign.html_file_path);
        if (!storageRes.ok) {
            return new NextResponse("Failed to load HTML file", { status: 500 });
        }

        const htmlContent = await storageRes.text();

        // 헤더 명시
        return new NextResponse(htmlContent, {
            status: 200,
            headers: {
                "Content-Type": "text/html; charset=UTF-8",
            },
        });

    } catch (error) {
        console.error("Render proxy error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}