## 개발자
심태양 (010-8632-1386)

## 프로젝트 과제 (리드마그넷 CRM 운영 시스템)
운영자가 AI를 이용해 생성한 HTML 기반 신청 폼을 손쉽게 배포하고,
인스타그램, X, 유튜브, 스레드 채널별 유입 성과(방문수, 순 방문자, 신청자, 전환율)를
실시간으로 모니터링할 수 있는 CRM 운영 시스템입니다.

## 로그인 정보
ID : admin
PW : glowup1234!

## 환경 변수 (.env.local) 설정
본 저장소를 클론한 후, 프로젝트 루트에 `.env.local` 파일을 생성하고 아래 값을 입력해주십시오.

## .env.local
NEXT_PUBLIC_SUPABASE_URL=https://malthvilwgjbmasmcecr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_I_faa9Fsli2NqwemfI8t4w_bGwAO_Gx

## 실행 방법
# 1. 패키지 설치
npm install

# 2. 로컬 개발 서버 실행
npm run dev

## 테스트 방법
npm test

## 프로젝트 문서
- [아키텍처 의사결정 기록 (ADR)](./ADR.md)
- [API 명세서](./API.md)
- [데이터베이스 스키마](./DB_SCHEMA.sql)

## Live Demo
- 서비스 주소 : https://glowuprizz-crm.vercel.app/login