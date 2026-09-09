// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // 로그인 폼 제출 핸들러
    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setErrorMessage("");

        try {
            // API 라우트로 로그인 요청 전송
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // 로그인 성공 시 관리자 대시보드로 이동
                router.push("/admin");
            } else {
                // 실패 시 에러 메시지 표시
                setErrorMessage(data.error || "로그인에 실패했습니다.");
                setIsLoading(false);
            }
        } catch (error) {
            setErrorMessage("오류가 발생 : " + error);
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* 로그인 스피너 모달 */}
            {isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin"></div>
                        <p className="text-white font-bold text-lg tracking-wide">
                            로그인 중...
                        </p>
                    </div>
                </div>
            )}

            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-md">
                    <h1 className="text-2xl font-bold text-center text-gray-900">
                        글로우업리즈 CRM 관리자
                    </h1>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700"> ID </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 bg-white"
                                placeholder="ID를 입력하세요"
                                required
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700"> PASSWORD </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 bg-white"
                                placeholder="비밀번호를 입력하세요"
                                required
                            />
                        </div>

                        {/* 에러 메시지 출력 영역 */}
                        {errorMessage && (
                            <p className="text-sm text-red-500 text-center">{errorMessage}</p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                        >
                            로그인
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}