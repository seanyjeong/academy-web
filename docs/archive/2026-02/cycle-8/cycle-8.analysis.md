# Academy Frontend Gap Analysis - Cycle 8

> **Analysis Type**: Gap Analysis (Plan vs Implementation)
>
> **Project**: Academy Unified Frontend
> **Analyst**: gap-detector
> **Date**: 2026-02-17
> **Scope**: 38 gaps identified in Paca/Peak full audit, resolved across 8 PDCA cycles + 1 iteration

---

## 1. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| CRITICAL Gaps (4 items, weight 3) | 12/12 | PASS |
| HIGH Gaps (10 items, weight 2) | 16/20 | PASS |
| MEDIUM Gaps (10 items, weight 1) | 9.5/10 | PASS |
| LOW Gaps (8 items, weight 0.5) | 1.0/4 | PARTIAL |
| **Weighted Total** | **38.5/46** | **83.7%** |

> **Note (Cycle 8 correction)**: Previous versions (1.0, 1.1) reported inflated subtotals
> (HIGH 19/20, MEDIUM 8.5/10, LOW 2/4, Total 41.5/46 = 90.2%). Re-auditing the per-item
> scores reveals the correct sums are HIGH 16/20, MEDIUM 6.5/10 (pre-cycle-8), LOW 1.0/4.
> All per-item statuses and evidence are unchanged; only the aggregation math is corrected.
> The true pre-cycle-8 total was **35.5/46 (77.2%)**, now **38.5/46 (83.7%)** after 3 fixes.

### Scoring Methodology

- CRITICAL: weight 3 each (max 12)
- HIGH: weight 2 each (max 20)
- MEDIUM: weight 1 each (max 10)
- LOW: weight 0.5 each (max 4)
- Total possible: 46 points
- Full fix = full weight, Partial fix = 50% weight, Not addressed = 0

### Iteration 1 Changes (Cycle 7)

| ID | Previous | Current | Delta | Details |
|----|:--------:|:-------:|:-----:|---------|
| H1 | PARTIAL (1/2) | FULL (2/2) | +1 | Added consultations + salaries export types (now 5/5) |
| H5 | PARTIAL (1/2) | FULL (2/2) | +1 | Full conversion dialog with new/link modes, admission types |
| M1 | PARTIAL (0.5/1) | FULL (1/1) | +0.5 | consultations.ts: 8 typed interfaces; training.ts: 15+ typed interfaces with Data<T> pattern |
| **Net** | | | **+2.5** | **33.0 --> 35.5 points** |

### Cycle 8 Changes (77.2% --> 83.7%)

| ID | Previous | Current | Delta | Details |
|----|:--------:|:-------:|:-----:|---------|
| M3 | NOT DONE (0/1) | FULL (1/1) | +1 | Bulk class-day change UI with checkbox selection, day picker, effective date scheduler |
| M8 | NOT DONE (0/1) | FULL (1/1) | +1 | Score table range mapping page with CRUD, type filter, gender/age, range editor |
| M10 | NOT DONE (0/1) | FULL (1/1) | +1 | Prorated calculation preview with API fallback, auto-fill base amount |
| **Net** | | | **+3** | **35.5 --> 38.5 points** |

---

## 2. Per-Gap Detailed Assessment

### CRITICAL (Weight 3 each)

| ID | Gap | Status | Score | Evidence |
|----|-----|--------|:-----:|----------|
| C1 | Student state transition logic incomplete | FULL | 3/3 | `students/[id]/page.tsx` L479-557: withdraw dialog with reason (L529-541), pause with start/end dates and reason (L479-502), resume API call (L504-515), graduate (L517-527), trial-to-enroll (L544-557). API: `studentsAPI.processRest`, `studentsAPI.withdraw`, `studentsAPI.resume` all implemented in `lib/api/students.ts` L34-41 |
| C2 | Notification settings 315 vs 3783 lines | FULL | 3/3 | `settings/notifications/page.tsx` 887 lines: provider config with Solapi/SENS toggle (L364-478), template CRUD with variable system (L482-617, TEMPLATE_VARIABLES L87-95), sender number tab (L619-665), notification logs tab (L667-737), test send (L299-317). API: `smsAPI.templates`, `smsAPI.createTemplate`, `smsAPI.updateTemplate`, `smsAPI.deleteTemplate`, `smsAPI.senderNumbers`, `smsAPI.logs`, `smsAPI.testSend` all in `lib/api/admin.ts` L155-167 |
| C3 | Payment student_name showing as ID | FULL | 3/3 | `payments/page.tsx` L291: `{p.student_name ?? \`학생 #${p.student_id}\`}` - fallback from student_name to ID display. Same pattern at L353 in pay dialog |
| C4 | Consultation slug 404 | FULL | 3/3 | Public route exists at `/app/(public)/c/[slug]/page.tsx` and `/app/(public)/c/[slug]/success/page.tsx`. API: `consultationsAPI.publicForm(slug)` and `consultationsAPI.publicSubmit(slug, data)` in `lib/api/consultations.ts` L98-99. Settings page has slug configuration |

**CRITICAL subtotal: 12/12 (100%)**

### HIGH (Weight 2 each)

| ID | Gap | Status | Score | Evidence |
|----|-----|--------|:-----:|----------|
| H1 | Excel Export missing (5 types) | **FULL** | **2/2** | `reports/page.tsx` L40-46: `EXPORT_TYPES` with 5 entries (financial, attendance, students, consultations, salaries). L69-84: `handleExport` uses `reportsAPI.export(type)` with blob download. All 5 Paca export categories covered. CSV format (not Excel) but functionally complete |
| H2 | Toss payment integration missing | NOT DONE | 0/2 | No Toss payment UI found in any page. `payments/page.tsx` has manual pay dialog (cash/card/transfer/other) but no online payment gateway integration |
| H3 | Promotion feature missing | FULL | 2/2 | `students/page.tsx` L169-196: `handlePromotePreview` with dry_run, `handlePromoteExecute`. Dialog at L399-468 showing promotion preview table with from_grade/to_grade. API: `studentsAPI.autoPromote({ dry_run })` in `lib/api/students.ts` L60-61 |
| H4 | Pause credit handling simplified | FULL | 2/2 | `payments/credits/page.tsx` 572 lines: full rest credit management with student search, credit summary (max/used/remaining), credit entries table, add/apply/delete credits. Discount tab with payment history. API: `studentsAPI.restCredits`, `studentsAPI.credits`, `studentsAPI.addCredits`, `studentsAPI.applyCredit`, `studentsAPI.deleteCredit`, `studentsAPI.manualCredit` in `lib/api/students.ts` L44-57 |
| H5 | Consultation conversion flow incomplete | **FULL** | **2/2** | `consultations/page.tsx` L159-162: state for `convertTarget`, `convertMode` (new/link), `convertAdmission`, `linkStudentId`. L305-328: `handleConvert()` dispatches to `consultationsAPI.linkStudent()` for link mode or `consultationsAPI.convert(id, { admission_type })` for new mode. Dialog UI at L923-1030: summary info panel, mode toggle (new registration vs link existing), admission type selector (regular/trial/transfer/readmission), student ID input for link mode. API layer: `consultations.ts` L85-86 with typed `LinkStudentData` interface |
| H6 | Schedule calendar structure difference | FULL | 2/2 | `schedules/page.tsx` 599 lines: full calendar view with monthly grid, time slot color dots (morning/afternoon/evening), day detail dialog with attendance indicators (`attendance_taken` checkmark vs X), makeup badges (`has_makeup`), closed/cancelled status, instructor display, capacity display. Recurring schedule support via `day_of_week` mapping |
| H7 | Mobile/tablet view missing | FULL | 2/2 | `layout.tsx` L50-76: mobile overlay sidebar with fixed positioning, transition animation, z-index layering, `lg:hidden`/`lg:static` breakpoints. `header.tsx` L170-175: hamburger menu button with `lg:hidden`. Sidebar closes on navigation (L36-38). `sidebar.tsx` uses fixed width with proper stacking |
| H8 | PWA push notification missing | NOT DONE | 0/2 | No service worker, PWA manifest, or push notification subscription logic found. Notification settings only handle SMS/alimtalk API providers |
| H9 | Student profile chart missing | FULL | 2/2 | `students/[id]/page.tsx` L1714-1833: training tab with RadarChart (latest vs best per record type), LineChart (trend over last 20 days), and summary table (type/latest/best/count). Uses recharts. Data computed via `radarData` (L371-389) and `trendData` (L391-407) memos |
| H10 | Instructor salary type simplified | FULL | 2/2 | `salaries/page.tsx` L57-69: `SALARY_TYPE_LABELS` with 4 types (hourly/per_class/monthly/mixed), `SALARY_TYPE_COLORS` with distinct badges. Salary interface includes `hourly_rate`, `per_class_rate`, `class_count`, `work_hours` fields (L46-49). Table shows salary type badge per instructor |

**HIGH subtotal: 16/20 (80%)**

### MEDIUM (Weight 1 each)

| ID | Gap | Status | Score | Evidence |
|----|-----|--------|:-----:|----------|
| M1 | API type safety (Record<string, unknown>) | **FULL** | **1/1** | `lib/api/consultations.ts`: 8 typed interfaces -- `ConsultationListParams`, `ConsultationCreateData`, `ConsultationUpdateData`, `ConductData`, `LinkStudentData`, `CalendarParams`, `EnrolledParams`, `ConsultationSettingsData`, `PublicSubmitData`. All API methods use typed parameters. `lib/api/training.ts`: 15+ typed interfaces -- `RecordTypeData`, `ScoreTableData`, `ExerciseData`, `TagData`, `PackData`, `PlanData`, `PresetData`, `RecordData`, `AssignmentData`, `LogData`, `TestData`, `TestSessionData`, `SessionRecordData`, `TrainingSettingsData`. Uses `Data<T> = T & Record<string, unknown>` pattern for extensibility while documenting known fields |
| M2 | Student type field missing | FULL | 1/1 | `lib/types/student.ts` referenced with full type including `Student`, `StudentStatus`, `StudentType`, `Gender`, `Grade`, `AdmissionType`, `TimeSlot`, `TrialDate`. Student detail page uses all fields including `rest_start_date`, `rest_end_date`, `rest_reason`, `trial_remaining`, `trial_dates` |
| M3 | Day-class bulk change missing | **FULL** | **1/1** | `students/page.tsx` L111-116: state for `showBulkDayDialog`, `selectedStudentIds` (Set), `bulkDays`, `bulkEffectiveDate`. L382-384: header checkbox with `toggleAllStudents`. L413-417: per-row checkbox. L300-317: "요일 일괄변경" button with CalendarCog icon + badge count. L493-553: Dialog with 7 day-picker buttons (DAY_LABELS), effective date input, submit handler. L208-242: `handleBulkDayChange` iterates selected students calling `studentsAPI.update()` with `class_days` or `class_days_next`/`class_days_effective_from` for scheduled changes. Student type has `class_days_next` (L28) and `class_days_effective_from` (L29) in `lib/types/student.ts` |
| M4 | Academy event page skeleton | FULL | 1/1 | `settings/events/page.tsx` 231 lines: typed `AcademyEvent` interface (L35-42), `EVENT_TYPES` with 4 colored categories (holiday/event/test/other L44-49), CRUD with dialog, badge coloring. Uses `settingsAPI.events()` and `settingsAPI.createEvent()` |
| M5 | SMS sender number management UI missing | FULL | 1/1 | `settings/notifications/page.tsx` L619-665: "sender" tab showing registered sender numbers in a table with default indicator badge. `smsAPI.senderNumbers()` API call at L197 |
| M6 | Consultation settings depth insufficient | FULL | 1/1 | `consultations/settings/page.tsx` 491 lines: slug configuration, field toggles (school/grade/sport_interest/preferred_date), notification settings, duration_minutes, max_per_slot, weekly hours per weekday with time range management, blocked slots with date/time/reason. Uses `consultationsAPI.settings()`, `consultationsAPI.updateSettings()`, `consultationsAPI.updateWeeklyHours()`, `consultationsAPI.addBlockedSlot()`, `consultationsAPI.removeBlockedSlot()` |
| M7 | Assignment drag-and-drop quality | PARTIAL | 0.5/1 | `training/assignments/page.tsx` 735 lines: full assignment management with class select per student, bulk assignment dialog with checkbox selection, instructor assignment, sync. However, no actual drag-and-drop interaction -- uses Select dropdowns and bulk dialogs instead. Still shows `ID: {assignment.student_id}` rather than student name (L428) |
| M8 | Score table range mapping UI incomplete | **FULL** | **1/1** | New page at `training/score-tables/page.tsx` (524 lines). Imports `scoreTablesAPI` and `recordTypesAPI` from `lib/api/training.ts`. Features: CRUD with create/edit/delete dialogs, record type filter (Select dropdown), gender options (all/male/female L59-63), age group options (all/middle/high/adult L65-70), inline RangeEditor component (L205-289) with min/max/score columns and add/remove controls. Card-based grid layout (lg:grid-cols-2). Sidebar entry added: "배점표" with TableProperties icon at `sidebar-config.ts` L82 |
| M9 | Grade tracking module depth insufficient | FULL | 1/1 | `training/stats/page.tsx` 537 lines: monthly averages with cards, bar chart visualization, leaderboard with ranking (gold/silver/bronze), student trend search with line chart (last 30 days). Uses `trainingStatsAPI.averages()`, `trainingStatsAPI.leaderboard()`. Record types with direction (higher/lower) properly displayed |
| M10 | Prorated calculation preview UI incomplete | **FULL** | **1/1** | `payments/new/page.tsx` L63-114: prorated calculation state and handlers. L76-81: `isMidMonth` memo detects enrollment_date day > 1 in same yearMonth. L83-105: `fetchProratedPreview` calls `paymentsAPI.prepaidPreview()` with fallback local calculation (totalDays, remainingDays, dailyRate, proratedAmount). L373-440: UI panel with Calculator icon, "중간 등록" badge for mid-month, "일할 계산 미리보기" button, preview grid showing total_days/remaining_days/daily_rate/prorated_amount, "이 금액 적용" button (L107-114: `applyProrated` sets baseAmount to prorated_amount). API: `paymentsAPI.prepaidPreview` at `lib/api/payments.ts` L20-21 |

**MEDIUM subtotal: 9.5/10 (95%)**

### LOW (Weight 0.5 each)

| ID | Gap | Status | Score | Evidence |
|----|-----|--------|:-----:|----------|
| L1 | OAuth social login | NOT DONE | 0/0.5 | No OAuth provider UI found in login flow |
| L2 | Dark mode | NOT DONE | 0/0.5 | No dark mode toggle or theme provider found |
| L3 | Global search UI | FULL | 0.5/0.5 | `header.tsx` L86-297: Cmd+K shortcut (L91-100), search dialog searching students and consultations via API (L102-156), result display with type badges (student/consultation), click-to-navigate |
| L4 | Version checker | NOT DONE | 0/0.5 | No version check mechanism found |
| L5 | Environment tracking (temp/humidity) | NOT DONE | 0/0.5 | No environment sensor UI found |
| L6 | Public scoreboard visual completeness | PARTIAL | 0.25/0.5 | `scoreboardAPI` exists in `lib/api/training.ts` L377-382. Public scoreboard route may exist but was not part of cycle scope |
| L7 | WebSocket real-time notification | NOT DONE | 0/0.5 | No WebSocket or SSE implementation found |
| L8 | Tablet device detection | PARTIAL | 0.25/0.5 | Mobile responsive layout implemented via `lg:` breakpoints in layout.tsx. No explicit tablet detection but responsive design covers tablet viewports |

**LOW subtotal: 1.0/4 (25%)**

---

## 3. Score Calculation

### Weighted Score

| Priority | Items | Max Weight | Achieved | Rate |
|----------|:-----:|:---------:|:--------:|:----:|
| CRITICAL (x3) | 4 | 12 | 12 | 100% |
| HIGH (x2) | 10 | 20 | 16 | 80% |
| MEDIUM (x1) | 10 | 10 | 9.5 | 95% |
| LOW (x0.5) | 8 | 4 | 1.0 | 25% |
| **Total** | **32** | **46** | **38.5** | **83.7%** |

### By Cycle Contribution

| Cycle | Gaps Addressed | Items Fixed | Weight Gained |
|-------|---------------|:-----------:|:------------:|
| Cycle 1 | C1, C3, C4, M1(partial) | 4 | 9.5 |
| Cycle 2 | H4 | 1 | 2 |
| Cycle 3 | C2, M5 | 2 | 4 |
| Cycle 4 | H1(partial), H3, H10 | 3 | 5 |
| Cycle 5 | H6, M4, M6 | 3 | 4 |
| Cycle 6 | H9, M7(partial), M9 | 3 | 3.5 |
| Cycle 7 | H7, L3 | 2 | 2.5 |
| Cycle 7 Iter 1 | H1(full), H5(full), M1(full) | 3 | 2.5 |
| Cycle 8 | M3, M8, M10 | 3 | 3 |
| **Total** | | **22 full + 3 partial** | **38.5/46** |

---

## 4. Remaining Gaps

### Not Implemented (7 items, 7.5 weighted points)

| ID | Weight | Description | Recommendation |
|----|:------:|-------------|----------------|
| H2 | 2 | Toss payment integration | Requires backend Toss API implementation first. Not addressable frontend-only |
| H8 | 2 | PWA push notification | Requires service worker + push subscription backend. Defer to post-MVP |
| L1 | 0.5 | OAuth social login | Backend OAuth flow needed. Low priority |
| L2 | 0.5 | Dark mode | CSS variable approach with Tailwind. Low priority |
| L4 | 0.5 | Version checker | Simple build hash comparison. Very low effort |
| L5 | 0.5 | Environment tracking | Requires IoT hardware integration. Defer |
| L7 | 0.5 | WebSocket notifications | Requires backend WebSocket support. Defer |

### Partially Implemented (2 items, 1 weighted point remaining)

| ID | Weight Remaining | Issue | Quick Fix |
|----|:---------------:|-------|-----------|
| M7 | 0.5 | No drag-and-drop; shows student ID not name | Replace ID display with name lookup; consider dnd-kit |
| L6 | 0.25 | Scoreboard API exists, public route completeness unknown | Verify public scoreboard route rendering |
| L8 | 0.25 | Responsive but no explicit tablet breakpoint | Add `md:` breakpoints for tablet-specific layout |

---

## 5. Code Quality Observations

### Positive Patterns

1. **Consistent fallback strategy**: All pages use `data.items ?? data ?? []` for API responses
2. **Loading states**: Every data-fetching page has spinner + empty state handling
3. **Type safety strong**: All three major API modules (students, consultations, training) now have typed interfaces
4. **Configuration-based design**: `STATUS_COLORS`, `SALARY_TYPE_LABELS`, `EVENT_TYPES`, `EXPORT_TYPES` use const objects
5. **Separation of concerns**: API layer (`lib/api/`) cleanly separates from page components
6. **Data<T> pattern**: `training.ts` uses `Data<T> = T & Record<string, unknown>` for extensibility while documenting known fields -- a pragmatic approach for evolving backend APIs

### Areas for Improvement

1. **Large page components**: `students/[id]/page.tsx` is 1887 lines. Consider extracting tab content into sub-components
2. **Assignment page shows ID**: `training/assignments/page.tsx` L428 shows `ID: {assignment.student_id}` instead of student name
3. **Instructor assignment by ID**: `training/assignments/page.tsx` L688 requires raw instructor ID input instead of searchable dropdown
4. **H1 export format**: CSV works but Excel (xlsx) would match Paca's export format more closely

---

## 6. Summary

### Achievement

- **22 of 32 gaps fully resolved** across 8 cycles + 1 iteration
- **3 gaps partially resolved** with clear remaining work (M7, L6, L8)
- **All 4 CRITICAL gaps (100%) fully resolved**
- **8 of 10 HIGH gaps fully resolved** (80%) with only Toss payment and PWA push remaining
- **9.5 of 10 MEDIUM gaps resolved** (95%) with only M7 drag-and-drop partial
- Weighted match rate: **83.7%** (corrected from previously reported 90.2%)

### Cycle 8 Verdict

The three targeted fixes (M3, M8, M10) achieved the projected +3 points, bringing the corrected score from 77.2% to 83.7%.

**M3 fix verification**: `/home/et/academy/web/src/app/(main)/students/page.tsx` lines 111-116 define bulk state (selectedStudentIds Set, bulkDays, bulkEffectiveDate). Lines 300-317: "요일 일괄변경" button with CalendarCog icon and selection count badge. Lines 493-553: Dialog with 7 day-picker toggle buttons (일~토), effective date scheduler input ("비워두면 즉시 적용"). Lines 208-242: handler iterates selected students calling `studentsAPI.update()` with `class_days` (immediate) or `class_days_next`/`class_days_effective_from` (scheduled). Student type confirmed at `lib/types/student.ts` L28-29.

**M8 fix verification**: `/home/et/academy/web/src/app/(main)/training/score-tables/page.tsx` (524 lines) is a new dedicated page. Uses `scoreTablesAPI` and `recordTypesAPI` from `lib/api/training.ts`. Features: CRUD with create dialog (record type selector, gender 3 options, age group 4 options, range editor), card-based grid layout (lg:grid-cols-2), inline edit with save/cancel, delete with confirm. RangeEditor component (L205-289) with min/max/score table and add/remove. Sidebar entry at `sidebar-config.ts` L82: "배점표" with TableProperties icon.

**M10 fix verification**: `/home/et/academy/web/src/app/(main)/payments/new/page.tsx` lines 63-114. `isMidMonth` memo (L76-81) detects enrollment_date day > 1 in same yearMonth. `fetchProratedPreview` (L83-105) calls `paymentsAPI.prepaidPreview()` with fallback local calculation. UI panel (L373-440): Calculator icon, "중간 등록" badge, "일할 계산 미리보기" button, preview grid (total_days, remaining_days, daily_rate, prorated_amount), "이 금액 적용" button that auto-fills base amount.

### Score Correction Note

During cycle 8 re-audit, the per-item scores were re-verified against the detailed evidence. The subtotal aggregations in versions 1.0 and 1.1 contained arithmetic errors (HIGH was reported as 19/20 but per-item sum is 16/20; MEDIUM was 8.5/10 but sum was 6.5/10; LOW was 2/4 but sum is 1.0/4). The per-item statuses, evidence, and code references remain unchanged and accurate. Only the subtotals and overall percentage are corrected.

### Recommendation

Match rate is 83.7%. There are some differences. The remaining 7.5 weighted points break down as:

**Frontend-addressable remaining (1.5 pts):**
1. M7: Assignment page student ID display + drag-and-drop (0.5 pts remaining)
2. L2: Dark mode (0.5 pts) -- deferred by user choice
3. L4: Version checker (0.5 pts) -- deferred to PWA phase

**Backend/infrastructure-dependent (6.0 pts, not addressable frontend-only):**
1. H2: Toss payment integration (2 pts) -- requires backend Toss API
2. H8: PWA push notification (2 pts) -- requires service worker + push backend
3. L1: OAuth social login (0.5 pts) -- requires backend OAuth flow
4. L5: Environment tracking (0.5 pts) -- requires IoT hardware
5. L7: WebSocket notifications (0.5 pts) -- requires backend WebSocket

**Excluding backend-dependent items**: 38.5 / (46 - 6.0) = 38.5/40 = **96.3%** of frontend-addressable gaps resolved.

Further iteration on M7 + L2 + L4 would bring the frontend-addressable rate to 100%.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-17 | Cycle 7 full analysis of 38 gaps | gap-detector |
| 1.1 | 2026-02-17 | Iteration 1: H1, H5, M1 fixes verified | gap-detector |
| 2.0 | 2026-02-17 | Cycle 8: M3, M8, M10 fixes verified (+3 pts). Subtotal arithmetic corrected (83.7%) | gap-detector |
