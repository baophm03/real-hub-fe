<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# RealHub — Project Context for AI Agents

> **READ THIS BEFORE WRITING ANY CODE.**
> Full business context: `docs/project-context.md` (single source of truth)
> Design system: `design.md` (single source of truth for UI/UX)
> API integration: `README.md`

## What is RealHub?
RealHub là nền tảng hệ sinh thái Bất động sản đa tenant (multi-tenant). Kết nối toàn vòng đời: sản phẩm → khách hàng → lịch hẹn → giao dịch → hoa hồng. Phase 1 = MVP Core, KHÔNG payment.

## Key Rules for AI Agents
1. **Đọc `docs/project-context.md`** trước khi implement bất kỳ feature nào — chứa roles, workflows, selling modes, commission engine, lead protection, visibility matrix, API routes.
2. **Tuân thủ `design.md`** cho mọi UI — Editorial Luxury + Soft Structuralism + Premium Minimalism. Font: Geist + Newsreader + Geist Mono. Color: warm monochrome.
3. **Không hardcode** dynamic fields, workflow states, commission rules, lead statuses — fetch từ API.
4. **Tenant header bắt buộc** (`x-tenant-code`) trên mọi API request trừ public routes.
5. **Permission-based UI** — ẩn/hiện button/menu theo `permissions` array từ `GET /api/users/me`.
6. **Pagination** dùng `limit` + `offset`, không có total count → infinite scroll.
7. **BE tự mask dữ liệu** (phone, price, address) — FE chỉ hiển thị, KHÔNG unmask.
8. **File upload** — `multipart/form-data`, field `file`/`files`, max 50MB, 10 files.
9. **Soft delete** — DELETE chỉ set `status: INACTIVE`.
10. **Auto-refresh token** trên 401 via interceptor.

## 9 Roles Phase 1
GUEST, CUSTOMER, OWNER, SALES, COLLABORATOR (CTV), TEAM_LEADER, AGENCY_ADMIN, OPERATOR, SUPER_ADMIN

## 5 Selling Modes
SELF_SELL, SALES_DISTRIBUTION, HYBRID, INTERNAL_ONLY, MARKETPLACE_PUBLIC

## FE Tech Stack
Next.js 16 App Router + React 18 + Tailwind CSS 4 + Zustand + TanStack Query v5 + React Hook Form + Zod + Lucide React + Recharts + Base UI + react-dropzone + date-fns + Leaflet + Framer Motion + Jodit + next-intl + CASL

## Dev Environment
- API: `http://localhost:3001/api`
- Swagger: `http://localhost:3001/api/docs`
- Tenant code: `DEMO`
- Seed: `admin@demo.realhub.local` / `Admin@123456` (SUPER_ADMIN), `sales@demo.realhub.local` / `Sales@123456` (SALES)
