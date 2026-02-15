# Task: feature/finance-module

## PDCA Do Phase - Auto-assigned Task

이 worktree는 PDCA 병렬 세션에서 자동 생성되었습니다.

## 할 일
academy/web 프로젝트의 재무 모듈을 구현해. 디자인 문서는 ../paca/docs/02-design/features/unified-frontend.design.md 참조.

구현할 페이지 (9개):
1. /payments - 수납 목록 (상태필터, 검색, 월별조회)
2. /payments/new - 수납 등록 (학생선택, 금액, 수납방법)
3. /payments/[id] - 수납 상세
4. /payments/[id]/edit - 수납 수정
5. /payments/credits - 학점/크레딧 관리
6. /salaries - 급여 목록 (강사별, 월별)
7. /salaries/[id] - 급여 상세
8. /incomes - 수입관리 (월별 수입 현황, 차트)
9. /expenses - 지출관리 (카테고리별 지출, 등록/조회)

API: /payments, /salaries, /incomes, /expenses
API 파일: src/lib/api/payments.ts, salaries.ts, incomes.ts, expenses.ts
모든 금액은 원화(₩) 포맷, 천단위 콤마
모든 UI 텍스트는 한국어!

## 완료 조건
1. 구현 완료 후 `/pdca analyze`로 gap 분석
2. 90% 이상이면 main에 머지 준비
3. 작업 완료 시 커밋하고 알려주세요
