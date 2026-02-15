# Gap Detector Memory

## Academy Web Project Structure
- Design doc: `/home/et/academy/paca/docs/02-design/features/unified-frontend.design.md`
- Implementation: `/home/et/academy/web/src/`
- 65 total pages designed, 53 implemented as of 2026-02-15
- Missing pages are all in core module (schedules, seasons, instructors CRUD sub-pages)
- Finance, consultation, training, admin, public modules are 100% complete

## Analysis Outputs
- Report: `/home/et/academy/paca/docs/03-analysis/unified-frontend.analysis.md`
- Overall match rate: 88.7% (weighted)
- Main gaps: 12 missing core CRUD pages, font family mismatch (Geist vs Inter), missing 403 page

## Key File Locations
- Sidebar config: `src/components/layout/sidebar-config.ts` (24 items, 5 sections)
- Header breadcrumbs: `src/components/layout/header.tsx` (BREADCRUMB_MAP)
- Auth store: `src/hooks/use-auth.ts` (Zustand, hasPermission, hasModule)
- Academy store: `src/hooks/use-academy.ts` (branch switching)
- API client: `src/lib/api/client.ts` (Axios, auto token/academy_id injection)

## Tech Stack Notes
- React 19 used despite design saying React 18 (design anticipated migration)
- Tailwind v4 (not v3), no tailwind.config file -- uses CSS-based config in globals.css
- Font: Geist Sans (Next.js default), not Inter as design specified
