# Task: feature/academy-module

## PDCA Do Phase - Auto-assigned Task

이 worktree는 PDCA 병렬 세션에서 자동 생성되었습니다.

## 할 일
academy/web 프로젝트의 학원 운영 모듈을 구현해. 디자인 문서는 ../paca/docs/02-design/features/unified-frontend.design.md 참조.

구현할 페이지 (20개):
1. /dashboard - 대시보드 (StatCard 4개: 전체학생/오늘출석/이번달수입/미납건수, 최근등록학생 테이블)
2. /students - 학생 목록 (탭필터: 전체/재원/체험/휴원/퇴원, 검색, 테이블)
3. /students/new - 학생 등록 폼
4. /students/[id] - 학생 상세 (탭: 기본정보/훈련/수납/출결/상담)
5. /students/[id]/edit - 학생 수정
6. /students/class-days - 수업일 관리
7. /schedules - 수업일정 목록
8. /schedules/new - 수업 생성
9. /schedules/[id] - 수업 상세
10. /schedules/[id]/edit - 수업 수정
11. /schedules/[id]/attendance - 수업별 출석체크
12. /attendance - 통합 출결관리
13. /attendance/students - 학생별 출결 (월별 캘린더)
14. /seasons - 시즌 목록
15. /seasons/new - 시즌 생성
16. /seasons/[id] - 시즌 상세
17. /seasons/[id]/edit - 시즌 수정
18. /seasons/[id]/enroll - 시즌 등록
19. /instructors - 강사 목록/상세/CRUD
20. /instructors/new, /instructors/[id], /instructors/[id]/edit

API 클라이언트는 src/lib/api/client.ts 사용. 엔드포인트:
- /students, /schedules, /attendance, /seasons, /instructors
- 각 API 파일을 src/lib/api/ 아래에 생성

학생 상태: active(재원)/paused(휴원)/withdrawn(퇴원)/graduated(졸업)/trial(체험)/pending(미등록)
시간대: morning→오전, afternoon→오후, evening→저녁
모든 UI 텍스트는 한국어!

## 완료 조건
1. 구현 완료 후 `/pdca analyze`로 gap 분석
2. 90% 이상이면 main에 머지 준비
3. 작업 완료 시 커밋하고 알려주세요
