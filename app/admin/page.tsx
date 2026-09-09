// app/admin/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../src/lib/supabase";
import { CHANNEL_UI } from "@/readonly";

interface Campaign {
    id: string;
    title: string;
    html_file_path: string;
    created_at: string;
}

interface CampaignView {
    campaign_id: string;
    channel: string;
    session_id: string;
}

interface Lead {
    id?: string;
    campaign_id: string;
    channel: string;
    name: string;
    phone: string;
    email: string;
    created_at?: string;
}

const INPUT_MAX_LENGTH_20 = 20;
const DEBOUNCE_DELAY_2000_MS = 2000;

export default function AdminPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const [isLoading, setIsLoading] = useState(false); // 캠페인 생성용
    const [isInitialLoading, setIsInitialLoading] = useState(true); // 대시보드 최초 진입 로딩용
    const [isSyncing, setIsSyncing] = useState(false); // 백그라운드 웹소켓 데이터 갱신용

    const [errorText, setErrorText] = useState("");
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [activeModalCampaignId, setActiveModalCampaignId] = useState<string | null>(null);

    const [campaignArray, setCampaignArray] = useState<Campaign[]>([]);
    const [viewArray, setViewArray] = useState<CampaignView[]>([]);
    const [leadArray, setLeadArray] = useState<Lead[]>([]);

    useEffect(() => {
        const loadData = async () => {
            setIsSyncing(true);

            try {
                const response = await fetch("/api/campaigns");

                if (response.status === 401) {
                    alert("세션이 만료되었습니다. 다시 로그인해주세요.");
                    router.push("/login");
                    return;
                }

                if (response.ok) {
                    const data = await response.json();
                    setCampaignArray(data.campaigns || []);
                }

                const { data: viewsData } = await supabase.from("campaign_views").select("campaign_id, channel, session_id");
                const { data: leadsData } = await supabase.from("leads").select("id, campaign_id, channel, name, phone, email, created_at");

                if (viewsData) setViewArray(viewsData);
                if (leadsData) setLeadArray(leadsData);

            } catch (error) {
                console.error("데이터 불러오기 실패:", error);
            } finally {
                setIsSyncing(false);
                setIsInitialLoading(false);
            }
        };

        loadData();
    }, [refreshTrigger, router]);


    useEffect(() => {
        let debounceTimer: NodeJS.Timeout;

        const handleDbChange = (payload: unknown) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                setRefreshTrigger((prev) => prev + 1);
            }, DEBOUNCE_DELAY_2000_MS);
        };

        const channel = supabase
            .channel("dashboard-realtime")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "campaign_views" }, handleDbChange)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, handleDbChange)
            .subscribe();

        return () => {
            clearTimeout(debounceTimer);
            supabase.removeChannel(channel);
        };
    }, []);

    const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        if (newValue.length > INPUT_MAX_LENGTH_20) {
            setErrorText(`제목은 최대 ${INPUT_MAX_LENGTH_20}자까지만 입력 가능합니다.`);
            setTitle(newValue.slice(0, INPUT_MAX_LENGTH_20));
        } else {
            setErrorText("");
            setTitle(newValue);
        }
    };

    const handleGenerateLink = async (campaignId: string, channel: string) => {
        const baseUrl = window.location.origin;
        const publicUrl = `${baseUrl}/f/${campaignId}?channel=${channel}`;

        try {
            await navigator.clipboard.writeText(publicUrl);
            alert(`[${channel}] 배포용 퍼블릭 링크가 복사되었습니다!\n\n${publicUrl}`);
        } catch (error) {
            alert(`링크 복사에 실패했습니다. 브라우저 권한을 확인해주세요. (${error})`);
        }
    };

    const handleDownloadCSV = (campaignTitle: string, campLeads: Lead[]) => {
        if (campLeads.length === 0) {
            alert("신청자 데이터가 없습니다.");
            return;
        }

        const headers = ["이름", "연락처", "이메일", "유입 채널", "신청 일시"];
        const rows = campLeads.map(l => [
            `"${l.name || ''}"`,
            `"${l.phone || ''}"`,
            `"${l.email || ''}"`,
            `"${l.channel || 'unknown'}"`,
            `"${l.created_at ? new Date(l.created_at).toLocaleString() : ''}"`
        ]);

        const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        const safeTitle = campaignTitle.replace(/[^a-zA-Z0-9가-힣]/g, '_');
        link.setAttribute("href", url);
        link.setAttribute("download", `신청자목록_${safeTitle}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!title.trim()) {
            alert("공백만으로는 제목을 설정할 수 없습니다!");
            return;
        }

        if (!file) {
            alert("HTML 파일을 선택해주세요!");
            return;
        }

        setIsLoading(true);

        const formData = new FormData();
        formData.append("title", title);
        formData.append("file", file);

        try {
            const response = await fetch("/api/campaigns", {
                method: "POST",
                body: formData,
            });

            if (response.status === 401) {
                alert("세션이 만료되었습니다. 다시 로그인해주세요.");
                router.push("/login");
                return;
            }

            if (response.ok) {
                alert("캠페인이 성공적으로 생성되었습니다!");
                setTitle("");
                setFile(null);
                setErrorText("");

                const fileInput = document.getElementById("file-upload") as HTMLInputElement;
                if (fileInput) fileInput.value = "";

                setRefreshTrigger(prev => prev + 1);
            } else {
                const errorData = await response.json();
                alert(`생성 실패 : ${errorData.error}`);
            }
        } catch (error) {
            alert("오류 발생 : " + error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDateTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    };

    const extractOriginalFileName = (filePath: string) => {
        if (!filePath) return "알 수 없는 파일";
        const lastPart = filePath.split('/').pop() || "";
        return decodeURIComponent(lastPart.replace(/^\d+-/, ''));
    };

    const handleLogout = async () => {
        if (!confirm("정말 로그아웃 하시겠습니까?")) return;

        try {
            const res = await fetch("/api/logout", { method: "POST" });
            if (res.ok) {
                router.push("/login");
            } else {
                alert("로그아웃 실패");
            }
        } catch (error) {
            console.error("Logout error:", error);
            alert("네트워크 오류가 발생했습니다.");
        }
    };

    const channelStats: Record<string, { views: number; leads: number }> = {
        instagram: { views: 0, leads: 0 },
        x: { views: 0, leads: 0 },
        youtube: { views: 0, leads: 0 },
        threads: { views: 0, leads: 0 },
        unknown: { views: 0, leads: 0 },
    };

    const campaignStats = campaignArray.map((campaign) => {
        const campViews = viewArray.filter((v) => v.campaign_id === campaign.id);
        const campLeads = leadArray.filter((l) => l.campaign_id === campaign.id);

        const totalVisits = campViews.length;
        const uniqueVisitors = new Set(campViews.map((v) => v.session_id)).size;
        const totalLeads = campLeads.length;
        const conversionRate = uniqueVisitors > 0 ? ((totalLeads / uniqueVisitors) * 100).toFixed(1) : "0.0";

        const localChannelStats: Record<string, { views: number; leads: number }> = {
            instagram: { views: 0, leads: 0 },
            x: { views: 0, leads: 0 },
            youtube: { views: 0, leads: 0 },
            threads: { views: 0, leads: 0 },
        };

        campViews.forEach((v) => {
            const ch = v.channel || "unknown";
            if (channelStats[ch]) channelStats[ch].views += 1;
            else channelStats["unknown"].views += 1;

            if (localChannelStats[ch]) localChannelStats[ch].views += 1;
        });

        campLeads.forEach((l) => {
            const ch = l.channel || "unknown";
            if (channelStats[ch]) channelStats[ch].leads += 1;
            else channelStats["unknown"].leads += 1;

            if (localChannelStats[ch]) localChannelStats[ch].leads += 1;
        });

        return {
            ...campaign,
            totalVisits,
            uniqueVisitors,
            totalLeads,
            conversionRate,
            formattedDate: formatDateTime(campaign.created_at),
            originalFileName: extractOriginalFileName(campaign.html_file_path),
            localChannelStats,
            campLeads
        };
    });

    const modalCampaign = campaignStats.find(c => c.id === activeModalCampaignId);

    if (isInitialLoading) {
        return (
            <div className={"min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8"}>
                <div className={"w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"} />
                <p className={"text-gray-600 font-bold text-lg tracking-wide animate-pulse"}>
                    데이터 로딩 중...
                </p>
                <p className={"text-gray-400 text-sm mt-2"}>잠시만 기다려주세요!</p>
            </div>
        );
    }

    return (
        <>
            {/* 캠페인 폼 제출 로딩 스피너 */}
            {isLoading && (
                <div className={"fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"}>
                    <div className={"flex flex-col items-center gap-4"}>
                        <div className={"w-12 h-12 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin"} />
                        <p className={"text-white font-bold text-lg tracking-wide"}>
                            파일 업로드 및 캠페인 생성 중...
                        </p>
                    </div>
                </div>
            )}

            {/* 신청자 상세 정보 팝업 */}
            {activeModalCampaignId && modalCampaign && (
                <div className={"fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"}>
                    <div className={"bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh]"}>
                        <div className={"px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50"}>
                            <div>
                                <h3 className={"text-lg font-bold text-gray-900"}>신청자 상세 정보</h3>
                                <p className={"text-[14px] text-gray-500 mt-0.5 truncate max-w-lg"}>캠페인 제목 : {modalCampaign.title}</p>
                            </div>
                            <button
                                onClick={() => setActiveModalCampaignId(null)}
                                className={"text-gray-400 hover:text-gray-600 font-bold text-xl px-2 py-1 cursor-pointer"}
                            >
                                ✕
                            </button>
                        </div>

                        <div className={"p-6 overflow-y-auto flex-1"}>
                            {modalCampaign.campLeads.length > 0 ? (
                                <div className={"border border-gray-200 rounded-xl overflow-hidden shadow-sm"}>
                                    <table className={"w-full text-left border-collapse table-fixed"}>
                                        <thead>
                                            <tr className={"bg-gray-100 text-xs font-bold text-gray-700 uppercase border-b border-gray-200"}>
                                                <th className={"w-[20%] px-4 py-3"}>이름</th>
                                                <th className={"w-[17.5%] px-4 py-3"}>연락처</th>
                                                <th className={"w-[25%] px-4 py-3"}>이메일</th>
                                                <th className={"w-[15%] px-4 py-3"}>유입 채널</th>
                                                <th className={"w-[22.5%] px-4 py-3"}>신청 일시</th>
                                            </tr>
                                        </thead>
                                        <tbody className={"divide-y divide-gray-200 text-sm text-gray-600"}>
                                            {modalCampaign.campLeads.map((lead, idx) => {
                                                const ui = CHANNEL_UI[lead.channel] || CHANNEL_UI["unknown"];
                                                return (
                                                    <tr key={lead.id || idx} className={"hover:bg-gray-50 transition-colors"}>
                                                        <td className={"px-4 py-3 font-semibold text-gray-900 truncate"} title={lead.name}>
                                                            {lead.name}
                                                        </td>
                                                        <td className={"px-4 py-3 truncate"} title={lead.phone}>
                                                            {lead.phone}
                                                        </td>
                                                        <td className={"px-4 py-3 break-all"} title={lead.email}>
                                                            {lead.email}
                                                        </td>
                                                        <td className={"px-4 py-3 truncate"}>
                                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border ${ui.bgColor} ${ui.textColor} ${ui.borderColor} max-w-full truncate`}>
                                                                <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill={ui.svgFill} stroke={ui.svgStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: ui.svgContent }} />
                                                                {ui.label}
                                                            </span>
                                                        </td>
                                                        <td className={"px-4 py-3 text-xs text-gray-400 truncate"} title={lead.created_at ? new Date(lead.created_at).toLocaleString() : "-"}>
                                                            {lead.created_at ? new Date(lead.created_at).toLocaleString() : "-"}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className={"text-center py-12 text-gray-400 font-medium"}>
                                    접수된 신청자가 없습니다.
                                </div>
                            )}
                        </div>

                        <div className={"px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center"}>
                            <span className={"text-xs text-gray-500 font-medium"}>
                                총 신청자 : <strong className={"text-blue-600"}>{modalCampaign.campLeads.length}</strong>명
                            </span>
                            <div className={"flex gap-2"}>
                                <button
                                    onClick={() => handleDownloadCSV(modalCampaign.title, modalCampaign.campLeads)}
                                    className={"px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"}
                                >
                                    목록 다운로드
                                </button>
                                <button
                                    onClick={() => setActiveModalCampaignId(null)}
                                    className={"px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm font-bold rounded-lg transition-colors cursor-pointer"}
                                >
                                    닫기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className={"min-h-screen bg-gray-50 p-8"}>
                <div className={"max-w-7xl mx-auto"}>

                    {/* 상단 헤더 및 미니 로딩 / 로그아웃 */}
                    <div className={"flex justify-between items-center mb-8"}>
                        <div className={"flex items-center gap-4"}>
                            <h1 className={"text-3xl font-bold text-gray-900"}>글로우업리즈 대시보드</h1>

                            {/* 미니 스피너 */}
                            {isSyncing && !isInitialLoading && (
                                <div className={"flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100 shadow-sm"}>
                                    <div className={"w-3 h-3 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"} />
                                    데이터 동기화 중...
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleLogout}
                            className={"px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer shadow-sm"}
                        >
                            로그아웃
                        </button>
                    </div>

                    <div className={"grid grid-cols-1 md:grid-cols-3 gap-8"}>
                        {/* 왼쪽 : 캠페인 생성 폼 */}
                        <div className={"md:col-span-1"}>
                            <div className={"bg-white p-6 rounded-xl shadow-md border border-gray-300"}>
                                <h2 className={"text-xl font-bold text-gray-800 mb-4"}>새 캠페인 만들기</h2>

                                <form onSubmit={handleSubmit} className={"space-y-4"}>
                                    <div>
                                        <label className={"block mb-1 text-sm font-medium text-gray-700 font-bold"}>
                                            캠페인 제목
                                        </label>
                                        <input
                                            type={"text"}
                                            value={title}
                                            onChange={handleTitleChange}
                                            className={"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 bg-white"}
                                            placeholder={"ex) 여름 시즌 인스타 이벤트"}
                                            required={true}
                                            pattern={".*\\S+.*"}
                                            onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("캠페인 제목을 입력해주세요!")}
                                            onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
                                        />
                                        <div className={"flex justify-between mt-1 px-1"}>
                                            <span className={"text-xs text-red-500 font-medium tracking-tight"}>
                                                {errorText}
                                            </span>
                                            <span className={`text-xs ${title.length >= INPUT_MAX_LENGTH_20 ? "text-red-500 font-bold" : "text-gray-400"}`}>
                                                {title.length} / {INPUT_MAX_LENGTH_20}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className={"block mb-1 text-sm font-medium text-gray-700 font-bold"}>
                                            AI로 생성한 HTML 등록하기
                                        </label>
                                        <input
                                            id={"file-upload"}
                                            type={"file"}
                                            accept={".html"}
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            className={"w-full px-2 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 bg-white file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer file:cursor-pointer file:rounded-full"}
                                            required={true}
                                            onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("파일을 선택해주세요!")}
                                            onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
                                        />
                                    </div>

                                    <button
                                        type={"submit"}
                                        disabled={isLoading || isSyncing}
                                        className={"w-full px-4 py-2 mt-4 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors cursor-pointer shadow-sm"}
                                    >
                                        캠페인 폼 저장하기
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* 오른쪽 : 캠페인 리스트 및 통계 */}
                        <div className={"md:col-span-2 space-y-6"}>

                            {/* 채널 성과 요약 */}
                            <div className={"bg-white p-5 rounded-xl shadow-md border border-gray-300"}>
                                <h2 className={"text-lg font-bold text-gray-800 mb-3"}>전체 채널 성과</h2>
                                <div className={"grid grid-cols-2 sm:grid-cols-4 gap-3"}>
                                    {Object.entries(channelStats).map(([channel, stats]) => {
                                        if (stats.views === 0 && stats.leads === 0) return null;
                                        return (
                                            <div key={channel} className={"bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-col items-center justify-center gap-1.5"}>
                                                <span className={"text-xs font-bold text-gray-600 uppercase"}>{channel}</span>
                                                <div className={"text-center"}>
                                                    <span className={"text-xs text-gray-500 mr-2"}>방문 {stats.views}</span>
                                                    <span className={"text-xs font-bold text-blue-600"}>신청 {stats.leads}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {Object.values(channelStats).every(s => s.views === 0 && s.leads === 0) && (
                                        <div className={"col-span-4 text-center text-sm text-gray-400 py-2"}>
                                            아직 수집된 데이터가 없습니다.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 운영 중인 캠페인 리스트 */}
                            <div className={"bg-white p-6 rounded-xl shadow-md border border-gray-300"}>
                                <h2 className={"text-xl font-bold text-gray-800 mb-4"}>운영 중인 캠페인</h2>

                                <div className={"space-y-6"}>
                                    {campaignStats.map((camp) => (
                                        <div key={camp.id} className={"p-5 border border-gray-300 rounded-xl hover:border-blue-400 transition-colors bg-white shadow-sm flex flex-col gap-4"}>
                                            <div className={"flex justify-between items-start gap-4"}>
                                                <div className={"min-w-0 flex-1"}>
                                                    <h3 className={"text-lg font-bold text-gray-900 flex items-center gap-2 flex-wrap"}>
                                                        <span className={"truncate"}>{camp.title}</span>
                                                        <span className={"text-sm font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md truncate max-w-[200px]"}>
                                                            {camp.originalFileName}
                                                        </span>
                                                    </h3>
                                                    <p className={"text-xs text-gray-500 mt-1"}>생성일 : {camp.formattedDate}</p>
                                                </div>

                                                <div className={"flex items-center gap-2 shrink-0"}>
                                                    <button
                                                        onClick={() => setActiveModalCampaignId(camp.id)}
                                                        className={"px-4 py-2 border-0 text-blue-700 text-sm font-semibold bg-blue-100 rounded-full hover:bg-blue-200 cursor-pointer"}
                                                    >
                                                        신청자 정보 보기
                                                    </button>

                                                    <button
                                                        className={"px-4 py-2 border-0 text-blue-700 text-sm font-semibold bg-blue-100 rounded-full hover:bg-blue-200 cursor-pointer"}
                                                        onClick={() => {
                                                            const publicUrl = `${window.location.origin}/f/${camp.id}`;
                                                            window.open(publicUrl, "_blank", "width=500, height=800");
                                                        }}
                                                    >
                                                        HTML 보기
                                                    </button>
                                                </div>
                                            </div>

                                            {/* 캠페인별 채널 유입 현황 */}
                                            {camp.totalVisits > 0 && (
                                                <div className={"flex flex-wrap gap-2"}>
                                                    {Object.entries(camp.localChannelStats).map(([ch, stats]) => {
                                                        if (stats.views === 0 && stats.leads === 0) return null;
                                                        return (
                                                            <div key={ch} className={"relative group inline-block cursor-help"}>
                                                                <span className={"text-[11px] font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-1 rounded-full uppercase inline-block"}>
                                                                    {ch} : {stats.views} / <span className={"text-blue-500"}>{stats.leads}</span>
                                                                </span>
                                                                <div className={"absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block whitespace-nowrap bg-gray-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-lg z-20 pointer-events-none"}>
                                                                    총 방문자 수 : {stats.views} / 신청자 : {stats.leads}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* 캠페인별 성과 지표 */}
                                            <div className={"grid grid-cols-4 gap-2 bg-slate-50 p-4 rounded-lg border border-slate-100"}>
                                                <div className={"text-center border-r border-slate-200"}>
                                                    <p className={"text-xs text-slate-500 font-medium mb-1"}>총 방문수</p>
                                                    <p className={"text-xl font-bold text-slate-700"}>{camp.totalVisits}</p>
                                                </div>
                                                <div className={"text-center border-r border-slate-200"}>
                                                    <p className={"text-xs text-slate-500 font-medium mb-1"}>순 방문자</p>
                                                    <p className={"text-xl font-bold text-slate-700"}>{camp.uniqueVisitors}</p>
                                                </div>
                                                <div className={"text-center border-r border-slate-200"}>
                                                    <p className={"text-xs text-slate-500 font-medium mb-1"}>신청자</p>
                                                    <p className={"text-xl font-bold text-blue-600"}>{camp.totalLeads}</p>
                                                </div>
                                                <div className={"text-center"}>
                                                    <p className={"text-xs text-slate-500 font-medium mb-1"}>전환율</p>
                                                    <p className={"text-xl font-bold text-emerald-500"}>{camp.conversionRate}%</p>
                                                </div>
                                            </div>

                                            {/* 링크 복사 영역 */}
                                            <div className={"pt-1"}>
                                                <p className={"text-sm font-medium text-gray-700 mb-2"}>채널별 배포 링크 복사하기</p>
                                                <div className={"flex flex-wrap gap-2"}>
                                                    {Object.entries(CHANNEL_UI).map(([chKey, ui]) => {
                                                        if (chKey === "unknown") return null;
                                                        return (
                                                            <button
                                                                key={chKey}
                                                                onClick={() => handleGenerateLink(camp.id, chKey)}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded font-semibold transition-colors cursor-pointer border ${ui.bgColor} ${ui.textColor} ${ui.borderColor} ${ui.hoverBg}`}
                                                            >
                                                                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill={ui.svgFill} stroke={ui.svgStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: ui.svgContent }} />
                                                                {ui.label}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {campaignStats.length === 0 && (
                                        <div className={"text-center py-10 text-gray-500 font-medium"}>
                                            아직 생성된 캠페인이 없습니다. 첫 캠페인을 만들어보세요!
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}