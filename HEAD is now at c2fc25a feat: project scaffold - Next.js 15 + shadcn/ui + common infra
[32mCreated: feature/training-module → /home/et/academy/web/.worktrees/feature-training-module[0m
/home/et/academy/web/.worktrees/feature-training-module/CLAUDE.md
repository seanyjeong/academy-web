# Task: feature/training-module

## PDCA Do Phase - Auto-assigned Task

이 worktree는 PDCA 병렬 세션에서 자동 생성되었습니다.

## 할 일
academy/web 프로젝트의 훈련 모듈을 구현해. 디자인 문서는 ../paca/docs/02-design/features/unified-frontend.design.md 참조.

구현할 페이지 (12개):
1. /training/records - 측정기록 (날짜별, 시간대탭: 오전반/오후반/저녁반, 테이블: 100m/멀리뛰기/배근력/윗몸/메모)
2. /training/plans - 훈련계획 목록/작성
3. /training/logs - 훈련일지 작성/조회
4. /training/exercises - 운동관리 (CRUD, 태그, 카테고리)
5. /training/presets - 프리셋 (운동팩 템플릿)
6. /training/tests - 월간테스트 목록
7. /training/tests/[testId] - 테스트 상세
8. /training/tests/[testId]/[sessionId] - 테스트 세션
9. /training/tests/[testId]/[sessionId]/records - 세션 기록 입력
10. /training/tests/[testId]/rankings - 테스트 순위
11. /training/assignments - 반배정 (드래그앤드롭)
12. /training/stats - 훈련 통계 (차트, 리더보드)

API: /training/records, /training/plans, /training/logs, /training/exercises, /training/presets, /training/tests, /training/assignments, /training/stats
API 파일: src/lib/api/training.ts
측정기록 색상: 최고기록=green, 미입력=yellow bg, 결석=red
모든 UI 텍스트는 한국어!

## 완료 조건
1. 구현 완료 후 `/pdca analyze`로 gap 분석
2. 90% 이상이면 main에 머지 준비
3. 작업 완료 시 커밋하고 알려주세요
