// app/api/campaigns/route.ts

import { NextResponse } from "next/server";
import { supabase } from "../../../src/lib/supabase";
import { cookies } from "next/headers";

// 캠페인 생성 API, 스크립트 주입
export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const isAdmin = cookieStore.get("admin_session");

        if (!isAdmin) {
            return NextResponse.json(
                { error: "관리자 권한이 만료되었거나 올바르지 않습니다. 다시 로그인해주세요." },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const title = formData.get("title") as string;
        const file = formData.get("file") as File;

        if (!title || !file) {
            return NextResponse.json(
                { error: "제목과 파일이 모두 필요합니다." },
                { status: 400 }
            );
        }

        const campaignId = crypto.randomUUID();

        const host = request.headers.get("host") || "localhost:3000";
        const protocol = host.includes("localhost") ? "http" : "https";
        const baseUrl = `${protocol}://${host}`;

        let htmlText = await file.text();

        const trackingScript = `
            <script>
                (function() {
                    const API_BASE_URL = "${baseUrl}";
                    const CAMPAIGN_ID = "${campaignId}";

                    const urlParams = new URLSearchParams(window.location.search);
                    const channel = urlParams.get('channel');

                    function setupForm() {
                        const form = document.querySelector('form');
                        if (!form) {
                            return false;
                        }

                        const enforceLimit = (inputSelector, maxLen) => {
                            const inputObj = form.querySelector(inputSelector);
                            if (inputObj) {
                                inputObj.setAttribute('maxlength', maxLen);
                                inputObj.addEventListener('input', (e) => {
                                    if (e.target.value.length > maxLen) {
                                        e.target.value = e.target.value.slice(0, maxLen);
                                    }
                                });
                            }
                        };

                        const enforcePhone = (inputSelector, maxLen) => {
                            const inputObj = form.querySelector(inputSelector);
                            if (inputObj) {
                                inputObj.setAttribute('maxlength', maxLen);
                                inputObj.addEventListener('input', (e) => {
                                    e.target.value = e.target.value.replace(/[^0-9-]/g, '');
                                    if (e.target.value.length > maxLen) {
                                        e.target.value = e.target.value.slice(0, maxLen);
                                    }
                                });
                            }
                        };

                        enforceLimit('input[name="name"]', 20);
                        enforcePhone('input[name="phone"]', 20);
                        enforceLimit('input[name="email"]', 50);

                        form.addEventListener('submit', async (e) => {
                            e.preventDefault();

                            if (!channel) {
                                alert("Admin에서 폼을 제출할 수 없습니다. 배포 링크를 통해 접속해주세요.");
                                return;
                            }

                            const fd = new FormData(form);
                            const name = fd.get('name') || "";
                            let phone = fd.get('phone') || "";
                            const email = fd.get('email') || "";

                            phone = phone.replace(/[^0-9]/g, '');

                            if (name.length > 20) { alert("이름은 최대 20자까지만 입력 가능합니다."); return; }
                            if (phone.length === 0) { alert("올바른 연락처(숫자)를 입력해주세요."); return; }
                            if (phone.length > 20) { alert("연락처는 최대 20자리 숫자까지만 입력 가능합니다."); return; }
                            if (email.length > 50) { alert("이메일은 최대 50자까지만 입력 가능합니다."); return; }

                            const data = {
                                campaign_id: CAMPAIGN_ID,
                                channel: channel,
                                name: name,
                                phone: phone,
                                email: email
                            };

                            try {
                                const res = await fetch(API_BASE_URL + '/api/leads', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(data)
                                });

                                if (res.ok) {
                                    alert('신청이 완료되었습니다!');
                                    form.reset();
                                } else {
                                    const errData = await res.json();
                                    alert(errData.error || '오류가 발생했습니다.');
                                }
                            } catch (error) {
                                console.error('Lead submit error : ', error);
                                alert('네트워크 오류가 발생했습니다.');
                            }
                        });

                        return true; // 성공적으로 셋업 완료
                    }

                    // DOM이 덜 그려졌을 경우를 대비해 폼이 생겼는지 체크
                    let attempts = 0;
                    const timer = setInterval(() => {
                        if (setupForm() || attempts > 30) {
                            clearInterval(timer);
                        }
                        attempts++;
                    }, 100);
                })();
            </script>
        `;

        if (htmlText.includes("</body>")) {
            htmlText = htmlText.replace("</body>", trackingScript + "\n</body>");
        } else {
            htmlText += trackingScript;
        }

        const fileName = `${Date.now()}-${file.name}`;
        const fileBuffer = Buffer.from(htmlText, "utf-8");

        const { data: storageData, error: storageError } = await supabase
            .storage
            .from("html_forms")
            .upload(fileName, fileBuffer, {
                contentType: "text/html; charset=UTF-8",
                upsert: false
            });

        if (storageError) {
            console.error("Storage 업로드 에러 : ", storageError);
            return NextResponse.json(
                { error: "파일 업로드에 실패했습니다." },
                { status: 500 }
            );
        }

        const { data: { publicUrl } } = supabase
            .storage
            .from("html_forms")
            .getPublicUrl(fileName);

        const { data: campaign, error: dbError } = await supabase
            .from("campaigns")
            .insert([
                {
                    id: campaignId,
                    title: title,
                    html_file_path: publicUrl
                }
            ])
            .select()
            .single();

        if (dbError) {
            console.error("DB 저장 에러 : ", dbError);
            return NextResponse.json(
                { error: "캠페인 정보 저장에 실패했습니다." },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, campaign });

    } catch (error) {
        console.error("서버 내부 에러 : ", error);
        return NextResponse.json(
            { error: "서버 처리 중 알 수 없는 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

// 캠페인 불러오기 API
export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const isAdmin = cookieStore.get("admin_session");

        if (!isAdmin) {
            return NextResponse.json(
                { error: "관리자 권한이 만료되었거나 올바르지 않습니다." },
                { status: 401 }
            );
        }

        const { data: campaigns, error } = await supabase
            .from("campaigns")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("캠페인 조회 에러:", error);
            return NextResponse.json(
                { error: "캠페인 목록을 불러오는데 실패했습니다." },
                { status: 500 }
            );
        }

        return NextResponse.json({ campaigns });

    } catch (error) {
        console.error("서버 내부 에러 : ", error);
        return NextResponse.json(
            { error: "서버 처리 중 알 수 없는 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}