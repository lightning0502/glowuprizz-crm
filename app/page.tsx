// app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  // 루트 경로("/")로 접속하면 관리자 대시보드(/admin)로 바로 이동
  // 로그인이 되어있지 않다면 middleware.ts가 자동으로 /login으로
  redirect("/admin");
}