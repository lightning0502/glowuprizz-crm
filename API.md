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