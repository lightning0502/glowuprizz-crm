// app/f/[id]/ViewTracker.tsx

"use client";

import { useEffect, useRef } from "react";

export default function ViewTracker({ campaignId, channel }: { campaignId: string; channel: string | null }) {
    const hasTracked = useRef(false);

    useEffect(() => {
        if (!campaignId || !channel) return;

        // Strict Mode 체크
        if (hasTracked.current) return;

        let sessionId;
        try {
            sessionId = localStorage.getItem("glowup_session_id");
            if (!sessionId) {
                sessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
                localStorage.setItem("glowup_session_id", sessionId);
            }
        } catch (e) {
            sessionId = Math.random().toString(36).substring(2);
        }

        hasTracked.current = true;

        fetch("/api/views", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ campaign_id: campaignId, channel, session_id: sessionId })
        }).catch(console.error);
    }, [campaignId, channel]);

    return null;
}