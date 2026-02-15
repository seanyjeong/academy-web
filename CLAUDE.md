# Academy Unified Frontend

## Stack
- **Framework**: Next.js 15 + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **State**: Zustand
- **HTTP**: Axios → `chejump.com:8350/api/v1`
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts 3.x

## API
- Base URL: `NEXT_PUBLIC_API_URL` (default: `http://localhost:8350/api/v1`)
- Token: `localStorage.token` → `Authorization: Bearer`
- Academy: `localStorage.activeAcademyId` → `X-Academy-Id`

## Student Status
`active`(재원) / `paused`(휴원) / `withdrawn`(퇴원) / `graduated`(졸업) / `trial`(체험) / `pending`(미등록)

## Time Slots
DB: `morning/afternoon/evening` → UI: `오전/오후/저녁`

## Conventions
- All UI text in Korean
- Sidebar permissions: `hasPermission(page)` + `hasModule(module)`
- Breadcrumbs on every page (Header component)
- Design doc: `../paca/docs/02-design/features/unified-frontend.design.md`
