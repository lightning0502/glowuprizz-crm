// app/f/[id]/page.tsx

import { notFound } from "next/navigation";
import { supabase } from "../../../src/lib/supabase";
import ViewTracker from "./ViewTracker";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
    searchParams: Promise<{
        channel?: string;
    }>;
}

export default async function PublicFormPage({ params, searchParams }: PageProps) {
    const resolvedParams = await params;
    const resolvedSearchParam = await searchParams;

    const campaignId = resolvedParams.id;
    const channel = resolvedSearchParam.channel;

    // 캠페인이 존재하는지 체크
    const { data: campaign, error } = await supabase
        .from("campaigns")
        .select("title")
        .eq("id", campaignId)
        .single();

    if (error || !campaign) {
        return notFound();
    }

    // channel이 존재할 때만 쿼리스트링에 포함
    const renderUrl = channel
        ? `/api/form/${campaignId}?channel=${encodeURIComponent(channel)}`
        : `/api/form/${campaignId}`;

    return (
        <div className={"min-h-screen bg-gray-100 flex items-center justify-center p-4"}>
            <ViewTracker campaignId={campaignId} channel={channel || null} />

            <iframe
                src={renderUrl}
                title={campaign.title}
                sandbox={"allow-scripts allow-forms allow-modals"}
                className={"w-full max-w-[500px] h-[800px] bg-white rounded-xl shadow-lg border-0"}
            />
        </div>
    );
}