## 개발자
심태양 (010-8632-1386)



#### 실행 방법 ####
1. 로그인 정보
ID : admin
PW : glowup1234!

2. 환경 변수 (.env.local) 설정
본 저장소를 클론한 후, 프로젝트 루트에 `.env.local` 파일을 생성하고 아래 값을 입력해주십시오.

3. .env.local
NEXT_PUBLIC_SUPABASE_URL=https://malthvilwgjbmasmcecr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_I_faa9Fsli2NqwemfI8t4w_bGwAO_Gx

4. 패키지 설치
npm install

5. 로컬 개발 서버 실행
npm run dev


#### 테스트 방법 ####
npm test



## 프로젝트 문서
- [아키텍처 의사결정 기록 (ADR)](./ADR.md)
- [API 명세서](./API.md)
- [데이터베이스 스키마](./DB_SCHEMA.sql)

## Live Demo
- 서비스 주소 : https://glowuprizz-crm.vercel.app/login