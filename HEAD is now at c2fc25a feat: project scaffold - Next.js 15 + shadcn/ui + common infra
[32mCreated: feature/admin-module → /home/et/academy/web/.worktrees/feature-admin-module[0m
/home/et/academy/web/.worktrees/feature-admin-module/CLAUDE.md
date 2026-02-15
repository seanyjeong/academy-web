# Task: feature/admin-module

## PDCA Do Phase - Auto-assigned Task

이 worktree는 PDCA 병렬 세션에서 자동 생성되었습니다.

## 할 일
academy/web 프로젝트의 관리+상담+공개 모듈을 구현해. 디자인 문서는 ../paca/docs/02-design/features/unified-frontend.design.md 참조.

구현할 페이지 (19개):

[상담 6개]
1. /consultations - 상담 목록
2. /consultations/new-inquiry - 새 문의
3. /consultations/[id]/conduct - 상담 진행
4. /consultations/calendar - 상담 캘린더
5. /consultations/enrolled - 등록된 상담
6. /consultations/settings - 상담 설정

[관리 8개]
7. /reports - 리포트
8. /reports/performance - 성과분석
9. /settings - 설정 (알림, 학원정보, 모듈관리, 멀티지점)
10. /settings/notifications - 알림 설정 (Solapi/SENS API키, 템플릿)
11. /settings/events - 학원 이벤트
12. /staff - 직원관리 (권한 설정)
13. /staff/users - 사용자 관리
14. /sms - SMS 발송 (대상필터, 발송내역)

[공개 5개]
15. /c/[slug] - 상담 공개 폼 (인증 불필요)
16. /c/[slug]/success - 상담 신청 완료
17. /consultation/[id] - 예약 확인
18. /board/[slug] - 스코어보드
19. /board/[slug]/scores - 스코어보드 점수

[인증 추가 4개]
20. /register - 회원가입
21. /forgot-password - 비밀번호 찾기
22. /reset-password - 비밀번호 재설정
23. /onboarding - 온보딩

API: /consultations, /reports, /settings, /staff, /sms, /notifications
SMS 설정: Solapi(카카오 알림톡) + SENS(네이버) 이중 지원, 각각 템플릿 관리
멀티지점: 설정에서 지점추가, 원장 초대(이메일), 초대수락 플로우
권한관리: 직원별 페이지/액션 권한 토글
공개 페이지는 (public) 라우트 그룹, 인증 불필요
모든 UI 텍스트는 한국어!

## 완료 조건
1. 구현 완료 후 `/pdca analyze`로 gap 분석
2. 90% 이상이면 main에 머지 준비
3. 작업 완료 시 커밋하고 알려주세요
