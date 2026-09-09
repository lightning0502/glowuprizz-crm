# API Documentation

## 1. 캠페인 등록
* URL : /api/campaigns
* Method : POST
* Content-Type : multipart/form-data
* Description : 관리자가 새로운 캠페인과 HTML 파일을 등록합니다.
* Request Body :
  - title (string): 캠페인 제목
  - file (File): 업로드할 .html 파일

## 2. 신청자(Lead) 폼 제출
* URL : /api/leads
* Method : POST
* Content-Type : application/json
* Description : 사용자가 배포된 링크를 통해 폼을 제출합니다.
* Request Body :
  - campaign_id (string): 캠페인 고유 ID
  - channel (string): 유입 채널 (instagram, x, youtube, threads)
  - name (string): 신청자 이름 (Max 20자)
  - phone (string): 신청자 연락처 (Max 20자)
  - email (string): 신청자 이메일 (Max 50자)

## 3. 조회수(View) 기록
* URL : /api/views
* Method : POST
* Content-Type : application/json
* Description : 사용자가 배포 링크에 방문할 시 조회수 및 세션을 기록합니다.
* Request Body :
  - campaign_id (string) : 캠페인 고유 ID
  - channel (string) : 유입 채널 (instagram, x, youtube, threads)
  - session_id (string) : 고유 세션 ID (중복 조회수 방지용)

## 4. 인증 (Authentication)
A. * URL : /api/auth/login
  * Method : POST
  * Content-Type : application/json
  * Description : 관리자가 이메일(아이디)과 비밀번호로 로그인하여 세션(쿠키)을 발급받습니다.
  * Request Body :
    - username (string) : 관리자 아이디
    - password (string) : 관리자 비밀번호

B. * URL : /api/logout
  * Method : POST
  * Description : 관리자 세션(쿠키)을 만료시켜 로그아웃 처리합니다.

## 5. 성과 조회 및 캠페인 목록 (Dashboard)
* URL : /api/campaigns
* Method : GET
* Description : 관리자 대시보드에서 캠페인 목록과 각 캠페인별 성과(방문수, 신청수, 전환율 등)를 조회합니다.
* Response : 캠페인 목록 및 통계 데이터 배열

## 6. 배포 링크 규격 (Routing)
* URL : /f/[campaign_id]
* Method : GET
* Description : 일반 사용자가 접근하는 공개 신청 폼 라우팅 주소입니다. 쿼리 파라미터를 통해 유입 채널을 구분합니다.
* Query Parameters :
  - channel (string): instagram, x, youtube, threads 중 택 1 (예: /f/1234?channel=instagram)

## 7. 원본 HTML 파일 렌더링
* URL : /api/form/[id]
* Method : GET
* Description : iframe 샌드박스 환경 내부에서 커스텀 폼을 렌더링하기 위해, 스토리지에 저장된 원본 HTML 파일 데이터를 반환합니다.