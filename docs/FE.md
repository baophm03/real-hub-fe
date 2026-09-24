# RealHub — Frontend Documentation

> **File này là nguồn sự thật duy nhất (single source of truth) cho Frontend RealHub.**
> Mọi AI agent (Claude Code, Cursor, Windsurf, Copilot, Cline...) phải đọc file này trước khi làm việc FE.
> Business context đầy đủ (roles, thuật ngữ, luồng nghiệp vụ, commission engine, policy engine) xem tại `BE.md`.

---

## 1. Tổng quan dự án

**RealHub** là nền tảng bất động sản **đa tenant (multi-tenant)** phục vụ các loại hình: Agency, Developer, Distributor. Hệ thống quản lý toàn bộ vòng đời: **sản phẩm (property) → khách hàng (customer/lead) → lịch hẹn (appointment) → giao dịch (deal) → hoa hồng (commission)**.

### 1.1 Vai trò người dùng (Roles)

| Role | Nhóm | Portal | Mô tả |
|------|------|--------|-------|
| `GUEST` | Khách hàng | (public website) | Khách vãng lai, xem website, gửi form cơ bản — không đăng nhập |
| `CUSTOMER` | Khách hàng | Customer Portal | Mua/thuê/đầu tư tự phục vụ: tìm/lưu/so sánh BĐS, tạo nhu cầu, đặt lịch, theo dõi giao dịch |
| `OWNER` | Nguồn BĐS | Owner Portal | Chủ BĐS: đăng sản phẩm, tự bán (SELF_SELL), quản lý lead/lịch hẹn/deal của mình |
| `SALES` | Kinh doanh | Sales Portal | Nhân viên bán hàng: nhận phụ trách sản phẩm, tạo link/QR, nhận lead, tạo deal |
| `COLLABORATOR` (CTV) | Kinh doanh | Sales Portal (giới hạn) | Cộng tác viên: chỉ tạo referral link/lead giới thiệu, không xem dữ liệu nhạy cảm, không xử lý giao dịch sâu |
| `TEAM_LEADER` | Quản lý | Dashboard | Trưởng nhóm sales: quản lý sales, duyệt giữ chỗ mềm, xử lý lead trong team |
| `AGENCY_ADMIN` | Doanh nghiệp | Dashboard (admin sàn) | Admin sàn/agency: quản lý tenant, users, sản phẩm, lead, deal, chính sách hoa hồng, assignment policy |
| `OPERATOR` | Vận hành | Dashboard (back-office) | Kiểm duyệt/CSKH/vận hành: xác minh chủ nguồn + sản phẩm, xử lý tranh chấp, audit |
| `SUPER_ADMIN` | Nền tảng | Dashboard (platform admin) | Quản trị toàn hệ thống: tenant, role, plan, cấu hình platform. Permission: `*` |

> **Quy tắc**: 1 user có thể có nhiều vai trò nghiệp vụ + nhiều tenant membership. Không thiết kế 1 tài khoản chỉ 1 vai trò cố định.
>
> **Vai trò nghiệp vụ vs role hệ thống**: tài liệu chính thức (§5–§6) liệt kê 10 vai trò nghiệp vụ — bảng trên là 9 **role hệ thống** Phase 1. Vai trò nghiệp vụ thứ 10 là **Developer / Chủ đầu tư** (tạo dự án/quỹ sản phẩm, tự phân phối hoặc mở cho agency/sales khai thác) — Phase 1 không có system role riêng, được mô hình qua `tenant.type = DEVELOPER` + user trong tenant đó.

### 1.2 Module chức năng

| Module | Chức năng chính |
|--------|----------------|
| **Auth** | Đăng ký, đăng nhập, refresh token, logout |
| **Users** | Profile người dùng, tạo user |
| **Tenants** | Quản lý tenant, domain, settings, feature flags |
| **Locations** | Cây địa lý (Tỉnh → Quận → Phường → Đường) |
| **Properties** | CRUD bất động sản, lọc đa tiêu chí |
| **Dynamic Fields** | Trường động tùy biến theo loại BĐS + form schema |
| **CRM** | Khách hàng, nhu cầu khách hàng, leads, hoạt động lead |
| **Appointments** | Lịch hẹn, deals, hoạt động deal, đặt cọc (reservation) |
| **Commission** | Kế hoạch hoa hồng, quy tắc, phân chia, tính toán |
| **Workflow** | Định nghĩa lu trình trạng thái + chuyển đổi |
| **File Upload** | Upload file lên MinIO, presigned URL, visibility |
| **Lead Protection** | Chính sách bảo hộ lead, tranh chấp |
| **Visibility** | Chính sách hiển thị & masking dữ liệu theo role |
| **Projects** | Dự án/quỹ căn của chủ đầu tư |
| **Property Contacts** | Form liên hệ → tự động tạo lead (guest → pool), `refCode` resolve sang sales |
| **Contact Requests** | Yêu cầu liên hệ từ khách (inbox xử lý) |
| **Assignments** | Sales nhận phụ trách sản phẩm, link/QR, assignment policy |
| **Lead Pool** | Lead chưa gán (`GET /leads/pool`, claim, assign → sales/team) |
| **Teams** | CRUD team + member, TEAM_LEADER scope |
| **Memberships** | User ↔ tenant ↔ role membership, `/memberships/stats` |
| **Roles & Permissions** | Role CRUD + permission matrix `MODULE:ACTION` |
| **Notifications** | In-app notification + rules/templates + email kèm (mailer) |
| **News** | Tin tức + categories (admin + public) |
| **Reports / Dashboard** | Báo cáo sales/commission/properties/team, dashboard stats |
| **Audit Log** | Nhật ký audit (query, filter, detail before/after) |
| **Import/Export** | Import/export jobs (property, lead, customer) |
| **Revalidation** | Policy kiểm tra lại sản phẩm định kỳ |
| **SEO** | SEO templates động + `/api/seo/resolve` |

### 1.3 Chế độ khai thác sản phẩm (Selling Modes)

| selling_mode | Ý nghĩa | Lead gán cho ai |
|--------------|---------|-----------------|
| `SELF_SELL` | Người đăng tự bán/tự cho thuê | Owner/chủ nguồn |
| `SALES_DISTRIBUTION` | Sales/agency khai thác | Sales theo assignment/team |
| `HYBRID` | Owner + sales cùng khai thác | Theo nguồn lead (owner link, sales link, CTV link, public) |
| `INTERNAL_ONLY` | Chỉ nội bộ tenant thấy | Theo người được phân quyền |
| `MARKETPLACE_PUBLIC` | Public trên RealHub marketplace | Theo lead source/policy |

> ✅ Đã chốt theo tài liệu chính thức: toàn bộ code dùng `MARKETPLACE_PUBLIC` (rename từ `AGENCY_DISTRIBUTION`, 2026-09-24). Data migration `20260924000001_rename_selling_mode` cập nhật các record cũ khi apply.

---

## 2. Tech Stack

| Layer | Công nghệ | Lý do |
|-------|-----------|-------|
| Framework | **Next.js 16.2.x** (App Router) | SSR/SSG cho SEO property pages, API routes cho BFF |
| UI Library | **React 18** (`react@^18`) | ⚠️ package.json dùng React 18, KHÔNG phải React 19 |
| Styling | **Tailwind CSS 4** | Utility-first, rapid development, consistent design |
| Components | **shadcn/ui** + **Base UI** (`@base-ui/react`) | Accessible, customizable, dark mode ready |
| Permissions UI | **CASL** (`@casl/ability` + `@casl/react`) | Ẩn/hiện UI theo `ability.can(action, module)` |
| State Management | **Zustand** (global) + **TanStack Query v5** (server state) | Đơn giản, mạnh mẽ cho data fetching & caching |
| Forms | **React Hook Form** + **Zod 4** | Validation schema đồng nhất với BE |
| Table/DataGrid | **TanStack Table v8** | Sorting, filtering, pagination, row selection |
| Charts | **Recharts** | Dashboard báo cáo, commission, thống kê |
| Icons | **Lucide React** | Nhẹ, nhất quán, đi kèm shadcn/ui |
| File Upload | **react-dropzone** | Drag & drop, multiple files |
| Date Picker | **date-fns** + **react-day-picker** | Xử lý lịch hẹn, reservation |
| Rich Text | **Jodit** (`jodit-react`) | Mô tả property, news content, note |
| Maps | **Leaflet** + **react-leaflet** | Hiển thị vị trí BĐS |
| Animation | **Framer Motion** + **GSAP** + `tailwindcss-animate` | Spring physics, scroll reveal |
| i18n | **next-intl** | Đa ngôn ngữ (vi/en) — public pages đã cover, portal/auth chưa |
| Toast/Command | **Sonner** + **cmdk** | Toast notification, command palette |
| Carousel | **Swiper** | Gallery ảnh BĐS, hero sections |
| HTTP client | **axios** + **Orval** generated client | Endpoint files + DTO models trong `src/lib/api/` |
| Theme | **next-themes** (deps) + custom `useTheme` | Dark mode toggle trong topbar |

> **Banned**: FontAwesome, Material Icons, emoji thay icon, Inter/Roboto/Arial làm font chính.

---

## 3. Design System

> Phần này là nguồn sự thật duy nhất cho phong cách UI/UX. Mọi component, page, layout phải tuân thủ.

### 3.1 Design Philosophy — Editorial Luxury + Soft Structuralism

- **Editorial Luxury** — tông màu ấm (cream, sage, espresso), typography serif cao cấp cho heading, cảm giác giấy/nhựa vật lý
- **Soft Structuralism** — typography Grotesk lớn, component bay nổi, shadow khuếch tán siêu mềm
- **Premium Utilitarian Minimalism** — bento grid bất đối xứng, viền 1px tinh tế, màu sắc khan hiếm

| Nguyên tắc | Mô tả |
|------------|-------|
| **Color is scarce** | Màu chỉ dùng cho semantic meaning hoặc accent tinh tế. Nền luôn neutral ấm |
| **Typography is hero** | Hierarchy bằng weight + size + font family, không phụ thuộc màu |
| **Whitespace is luxury** | Padding tối thiểu `py-24` cho section. Để design "thở" |
| **Motion is invisible** | Animation có mặt nhưng không gây phân tâm. Spring physics, cubic-bezier |
| **Cards are physical** | Double-bezel nested architecture, không đặt card phẳng trên background |

### 3.2 Color System

#### Light Mode (Default)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#FBFBFA` | Canvas nền (warm bone) |
| `--surface` | `#FFFFFF` | Card surface |
| `--surface-muted` | `#F7F6F3` | Secondary surface, input background |
| `--foreground` | `#1A1A1A` | Body text (off-black) |
| `--foreground-muted` | `#787774` | Secondary text |
| `--border` | `#EAEAEA` | Structural border, divider |
| `--border-strong` | `#D1D0CE` | Active border, focus ring |
| `--accent` | `#1A1A1A` | Primary CTA background |
| `--accent-foreground` | `#FFFFFF` | Primary CTA text |

#### Dark Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#0F0F0E` | Canvas nền (warm off-black) |
| `--surface` | `#1A1A19` | Card surface |
| `--surface-muted` | `#242423` | Secondary surface |
| `--foreground` | `#EDEDEC` | Body text |
| `--foreground-muted` | `#9C9B98` | Secondary text |
| `--border` | `rgba(255,255,255,0.08)` | Structural border |
| `--border-strong` | `rgba(255,255,255,0.15)` | Active border |
| `--accent` | `#EDEDEC` | Primary CTA background |
| `--accent-foreground` | `#0F0F0E` | Primary CTA text |

#### Semantic Accent Colors (Muted Pastels)

Màu chỉ dùng cho tag, badge, status indicator. **Tuyệt đối không dùng làm background cho section lớn hoặc button primary.**

| Token | Background | Text | Usage |
|-------|-----------|------|-------|
| `--accent-red` | `#FDEBEC` | `#9F2F2D` | Error, danger, overdue |
| `--accent-blue` | `#E1F3FE` | `#1F6C9F` | Info, pending |
| `--accent-green` | `#EDF3EC` | `#346538` | Success, available, active |
| `--accent-yellow` | `#FBF3DB` | `#956400` | Warning, draft, pending approval |
| `--accent-purple` | `#F0E9F7` | `#6B3B8C` | Special, featured |

#### Forbidden Colors

- **Tuyệt đối KHÔNG dùng**: AI purple/blue neon gradient, glow effect, pure black `#000000`, oversaturated accent
- **Không dùng gradient** trừ khi explicit request
- **Không dùng glow/shadow màu** làm primary affordance

### 3.3 Typography

#### Font Stack

| Role | Font | Fallback |
|------|------|----------|
| **Sans (Body, UI)** | `Geist` | `SF Pro Display`, `Helvetica Neue`, sans-serif |
| **Serif (Editorial Heading)** | `Newsreader` | `Instrument Serif`, `Playfair Display`, serif |
| **Mono (Data, Code, Meta)** | `Geist Mono` | `SF Mono`, `JetBrains Mono`, monospace |

> **Banned fonts**: Inter, Roboto, Arial, Open Sans, Helvetica (as primary)

#### Type Scale

| Token | Size | Weight | Line Height | Tracking | Font | Usage |
|-------|------|--------|-------------|----------|------|-------|
| `display` | `text-5xl md:text-7xl` | 600 | `leading-[1.05]` | `tracking-tighter` | Serif | Hero heading, landing page |
| `h1` | `text-4xl md:text-5xl` | 600 | `leading-[1.1]` | `tracking-tight` | Serif | Page title |
| `h2` | `text-3xl md:text-4xl` | 600 | `leading-[1.15]` | `tracking-tight` | Sans | Section heading |
| `h3` | `text-xl md:text-2xl` | 600 | `leading-[1.25]` | `tracking-tight` | Sans | Card title, subsection |
| `h4` | `text-lg` | 600 | `leading-[1.3]` | `normal` | Sans | Label heading |
| `body` | `text-base` | 400 | `leading-relaxed` | `normal` | Sans | Paragraph, body text |
| `body-sm` | `text-sm` | 400 | `leading-relaxed` | `normal` | Sans | Secondary text, description |
| `caption` | `text-xs` | 500 | `leading-normal` | `normal` | Sans | Caption, helper text |
| `label` | `text-xs` | 600 | `leading-normal` | `tracking-wide` | Sans | Form label, eyebrow tag |
| `mono` | `text-sm` | 500 | `leading-normal` | `normal` | Mono | Data, number, code, metadata |

#### Typographic Rules

- Heading dùng `text-balance` (Tailwind: `text-balance`)
- Body dùng `text-pretty` (Tailwind: `text-pretty`)
- Number/data dùng `tabular-nums` (Tailwind: `tabular-nums`)
- Serif font **chỉ** dùng cho heading editorial/landing page. **KHÔNG** dùng serif cho dashboard/software UI
- Eyebrow tag: `text-[10px] uppercase tracking-[0.2em] font-medium` trước heading lớn

### 3.4 Spacing & Layout

#### Spacing Scale

| Context | Padding/Gap |
|---------|-------------|
| Section vertical | `py-24` đến `py-40` |
| Section horizontal | `px-6 md:px-8 lg:px-12` |
| Card internal | `p-6` đến `p-10` |
| Component gap | `gap-4` đến `gap-8` |
| Form field gap | `gap-2` (label-input-error) |
| Tight UI (dense data) | `gap-2` đến `gap-3`, `p-3` đến `p-4` |

#### Container

```tsx
<div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12">
  {/* content */}
</div>
```

#### Layout Archetypes

RealHub dùng 3 layout archetype chính, xen kẽ để tránh nhàm chán:

1. **Asymmetrical Bento** — Dashboard, feature grid. CSS Grid với `col-span` khác nhau
2. **Editorial Split** — Landing page, property detail. 50/50 split, typography lớn bên trái
3. **Z-Axis Cascade** — Card stack cho listing, deal pipeline. Overlap nhẹ với rotation

#### Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| `base` (mobile) | `<768px` | Single column, `w-full`, `px-4`, bottom nav |
| `md` (tablet) | `768px-1279px` | Collapsible sidebar, 2-col grid |
| `lg` (desktop) | `>=1280px` | Full sidebar + content, multi-col grid |

> **Quy tắc mobile**: Mọi layout asymmetric phải fallback single-column (`grid-cols-1`) với `gap-6` dưới `768px`. Gỡ bỏ rotation, overlap, negative margin.

#### Viewport Height

**Tuyệt đối không dùng `h-screen`**. Luôn dùng `min-h-[100dvh]` cho full-height section để tránh iOS Safari viewport jumping.

### 3.5 Component Architecture

#### Double-Bezel (Nested Card)

Mọi card premium phải có cấu trúc nested:

```tsx
{/* Outer Shell */}
<div className="bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 p-1.5 rounded-[2rem]">
  {/* Inner Core */}
  <div className="bg-white dark:bg-surface rounded-[calc(2rem-0.375rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] p-6">
    {/* content */}
  </div>
</div>
```

#### Button

| Variant | Style |
|---------|-------|
| **Primary** | `bg-accent text-accent-foreground rounded-md px-5 py-2.5 font-medium`. Hover: `bg-foreground/90`. Active: `scale-[0.98]` |
| **Secondary** | `bg-surface-muted text-foreground rounded-md border border-border px-5 py-2.5`. Hover: `bg-border/50` |
| **Ghost** | `text-foreground hover:bg-surface-muted rounded-md px-5 py-2.5` |
| **Destructive** | `bg-accent-red/10 text-accent-red-text rounded-md px-5 py-2.5` |

Button-in-Button pattern cho CTA có arrow:

```tsx
<button className="group inline-flex items-center gap-3 rounded-full bg-accent text-accent-foreground px-6 py-3">
  <span>Get Started</span>
  <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-px">
    <ArrowUpRight size={14} />
  </span>
</button>
```

#### Input

```tsx
<div className="flex flex-col gap-2">
  <label htmlFor="email" className="text-xs font-semibold tracking-wide text-foreground-muted">
    Email
  </label>
  <input
    id="email"
    type="email"
    className="rounded-md border border-border bg-surface px-4 py-2.5 text-base
               focus:border-border-strong focus:outline-none focus:ring-2 focus:ring-border-strong/20
               placeholder:text-foreground-muted/50"
  />
  <p className="text-xs text-foreground-muted">Helper text</p>
</div>
```

#### Badge / Tag

```tsx
<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide"
      style={{ backgroundColor: 'var(--accent-green)', color: 'var(--accent-green-text)' }}>
  Available
</span>
```

#### Card (Minimal)

```tsx
<div className="rounded-xl border border-border bg-surface p-6 transition-shadow duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
  {/* content */}
</div>
```

#### Divider

```tsx
<hr className="border-border" />
// hoặc
<div className="border-t border-border" />
```

#### Sidebar Navigation

- Desktop (>=1280px): Fixed sidebar `w-64`, border-right
- Tablet (768-1279px): Collapsible, drawer
- Mobile (<768px): Bottom navigation bar

#### Keystroke

```tsx
<kbd className="rounded border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-xs">
  Ctrl + K
</kbd>
```

### 3.6 Iconography

Sử dụng **Lucide Icons** (`lucide-react`).

```tsx
import { House, Users, Calendar, BarChart3 } from 'lucide-react'

<House size={20} />
```

- Standardize `size` trong toàn app (20px cho nav, 16px cho inline, 24px cho heading)
- Icon-only button **bắt buộc** có `aria-label`
- Decorative icon: `aria-hidden="true"`
- Không dùng emoji thay icon trong bất kỳ trường hợp nào

### 3.7 Motion & Animation

| Principle | Rule |
|-----------|------|
| **Spring physics** | `type: "spring", stiffness: 100, damping: 20` cho interactive |
| **Custom easing** | `cubic-bezier(0.16, 1, 0.3, 1)` cho entrance, `cubic-bezier(0.32, 0.72, 0, 1)` cho UI |
| **GPU only** | Chỉ animate `transform` + `opacity`. Không animate `width`, `height`, `top`, `left`, `margin`, `padding` |
| **Duration** | Interaction feedback: max 200ms. Entrance: 600-800ms |
| **Reduced motion** | Respect `prefers-reduced-motion` |

#### Entrance Animation (Scroll Reveal)

```tsx
<motion.div
  initial={{ opacity: 0, y: 16 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-80px" }}
  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
>
  {/* content */}
</motion.div>
```

#### Staggered Reveal

```tsx
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
}
```

#### Hover States

- Card: `transition-shadow duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]`
- Button: `active:scale-[0.98]` (physical press)
- Nested icon: `group-hover:translate-x-0.5 group-hover:-translate-y-px`

#### Forbidden Motion

- `linear` hoặc `ease-in-out` default
- `window.addEventListener('scroll')` — dùng `IntersectionObserver` hoặc Framer Motion `whileInView`
- `backdrop-blur` trên scrolling container
- Looping animation trên off-screen element (phải pause)
- Layout-triggering animation properties

### 3.8 Interaction States

Mọi component phải có đủ 4 trạng thái:

| State | Implementation |
|-------|---------------|
| **Loading** | Skeleton loader matching layout size. `aria-busy="true"`. Không dùng generic spinner |
| **Empty** | Empty state composition + 1 clear next action (CTA button) |
| **Error** | Inline error, `aria-describedby` link to field, `aria-invalid="true"` |
| **Success** | Subtle confirmation, không block workflow |

#### Skeleton Loader Example

```tsx
<div className="animate-pulse rounded-xl border border-border bg-surface p-6">
  <div className="h-4 w-3/4 rounded bg-border/50" />
  <div className="mt-3 h-3 w-1/2 rounded bg-border/30" />
</div>
```

### 3.9 Accessibility Checklist

| Rule | Priority |
|------|----------|
| Mọi interactive control có accessible name | Critical |
| Icon-only button có `aria-label` | Critical |
| Mọi input có `<label>` associated | Critical |
| Tab key reach tất cả interactive element | Critical |
| Focus visible cho keyboard user | Critical |
| Modal trap focus + restore focus on close | Critical |
| Escape đóng dialog/overlay | Critical |
| Error link tới field qua `aria-describedby` | High |
| Required field được announced | High |
| `aria-live` cho critical form error | Medium-High |
| `prefers-reduced-motion` được respect | Medium |
| Image có alt text (meaningful hoặc empty) | Medium |

### 3.10 Data Display Patterns

#### DataGrid / Table

- Dùng TanStack Table v8
- Sorting, filtering, pagination
- Row selection cho bulk action
- `tabular-nums` cho numeric column
- Dense mode: `p-3`, standard: `p-4`
- Divider: `border-t border-border`, không dùng card box cho mỗi row

#### Kanban Board

- Column = status (fetch từ `/api/workflows`)
- Drag & drop: `@dnd-kit` hoặc Framer Motion `layoutId`
- Card: tên khách, phone (masked), giá, ngày tạo, avatar
- Column header: count badge

#### Charts

- Dùng Recharts
- Color: neutral foreground + 1 accent. Không dùng rainbow palette
- Axis: mono font, `text-xs`, muted color
- Grid line: `stroke="var(--border)"` ultra light
- Tooltip: card style, `rounded-md border border-border bg-surface p-3 shadow-sm`

#### Stat Card

```tsx
<div className="flex flex-col gap-1">
  <span className="text-xs font-medium tracking-wide text-foreground-muted uppercase">Total Deals</span>
  <span className="text-3xl font-semibold tabular-nums tracking-tight">1,247</span>
  <span className="text-xs text-foreground-muted">+12.4% vs last month</span>
</div>
```

> Không box mọi stat vào card. Dùng `border-t` hoặc negative space để group.

### 3.11 Z-Index Scale

| Layer | Z-Index | Usage |
|-------|---------|-------|
| Base | `0` | Normal content |
| Sticky | `10` | Sticky header, sidebar |
| Dropdown | `20` | Dropdown menu, popover |
| Drawer | `30` | Side drawer |
| Modal | `40` | Dialog, modal |
| Toast | `50` | Toast notification |
| Tooltip | `60` | Tooltip |

> **Không dùng** arbitrary `z-[9999]` hoặc `z-50` ngoài scale này.

### 3.12 Performance Guardrails

| Rule | Detail |
|------|--------|
| GPU-safe animation | Chỉ `transform` + `opacity` |
| Blur constraint | `backdrop-blur` chỉ cho fixed/sticky element |
| Noise/grain overlay | Chỉ cho `position: fixed; pointer-events: none` |
| `will-change` | Chỉ khi đang animate, gỡ sau khi xong |
| Image | Dùng `next/image`, set `width` + `height` hoặc `fill` |
| Bundle | Dynamic import cho heavy component (charts, maps, editor) |
| Perpetual motion | Isolate trong Client Component riêng, `React.memo` |

### 3.13 AI Tells — Forbidden Patterns

| Pattern | Why Banned |
|---------|-----------|
| Inter/Roboto font | Generic, không premium |
| AI purple/blue gradient | Cliché, không phù hợp BĐS cao cấp |
| 3-column equal card row | Generic AI layout |
| Centered hero | Nhàm chán, dùng asymmetric split |
| Generic names ("John Doe") | Dùng tên realistic tiếng Việt |
| Filler words ("Elevate", "Seamless") | Dùng ngôn ngữ cụ thể |
| Emoji in code/markup | Dùng icon proper |
| `h-screen` | Bug iOS Safari, dùng `min-h-[100dvh]` |
| Generic spinner | Dùng skeleton loader |
| Glow/neon shadow | Dùng inner border hoặc tinted shadow |

### 3.14 Content Guidelines

#### Voice & Tone

- **Professional nhưng gần gũi** — tiếng Việt là ngôn ngữ chính
- **Concrete, không sáo rỗng** — "Tạo bất động sản mới" thay vì "Elevate your property experience"
- **Action-oriented** — button label là động từ: "Lưu", "Tạo mới", "Xuất báo cáo"

#### Naming Convention

- Page title: Tiếng Việt, ngắn gọn — "Bất động sản", "Khách hàng", "Lịch hẹn"
- Button: Động từ + danh từ — "Thêm khách hàng", "Tạo lịch hẹn"
- Status: Tiếng Việt — "Mới", "Đã liên hệ", "Đã chuyển đổi"
- Table header: Ngắn, uppercase optional — "Tên", "Số điện thoại", "Trạng thái"

#### Placeholder Data

- Tên: "Nguyễn Văn An", "Trần Thị Bích", "Lê Minh Châu"
- SĐT: "0901 234 567", "0987 654 321"
- Email: "an.nguyen@abcrealestate.vn"
- Company: "ABC Real Estate", "Vinhomes Central", "Masteri Thao Dien"

### 3.15 Theme & Branding

#### Dynamic Tenant Theme

Đã implement qua `useTenantBranding` hook (`lib/hooks/use-tenant-branding.ts`) + `TenantBranding` component mount ở `[locale]/layout.tsx`. Hook gọi public endpoint `GET /api/tenants/code/:code` (tenant code từ auth-store → `NEXT_PUBLIC_TENANT_CODE` → `"DEMO"`) rồi apply `primaryColor` lên CSS var `--primary` (validate hex trước khi set):

```tsx
// lib/hooks/use-tenant-branding.ts
useEffect(() => {
  if (primaryColor && HEX_COLOR_RE.test(primaryColor)) {
    document.documentElement.style.setProperty("--primary", primaryColor);
    return () => document.documentElement.style.removeProperty("--primary");
  }
}, [primaryColor]);
```

#### Dark Mode

- Toggle trong topbar (custom `useTheme` hook, lưu localStorage)
- Dùng `class` strategy (Tailwind)
- `next-themes` có trong deps nhưng chưa dùng (custom hook chưa respect `prefers-color-scheme`)

#### Branding Assets

- Logo: load từ tenant `logoUrl`
- Primary color: override CSS variable `--primary` (Tailwind v4 primary token)

---

## 4. Quy ước API

### 4.1 Base URL & Prefix

```
Base URL:     http://localhost:3001
API Prefix:   /api
Swagger:      /api/docs
```

### 4.2 Authentication

```
Authorization: Bearer <access_token>
```

- Access token TTL: **15 phút** (900s)
- Refresh token TTL: **7 ngày** (604800s)
- Token response sau login/refresh (trả trong body, FE tự lưu):

```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Nguyen Van A"
  }
}
```

> **Lưu trữ token ở FE**: accessToken trong Zustand store (memory), refreshToken trong localStorage (để persist qua reload). Mọi request attach `Authorization: Bearer <accessToken>` + `x-tenant-code`.

### 4.3 Tenant Resolution

Mỗi request (trừ public routes) phải gửi **một trong hai**:

| Cách | Header | Ví dụ |
|------|--------|-------|
| Theo code | `x-tenant-code: DEMO` | Khuyên dùng cho dev |
| Theo domain | Tự động resolve từ `Origin` / `Host` header | Production |

### 4.4 Public Routes (không cần auth)

> Vẫn resolve tenant qua `x-tenant-code` hoặc domain (TenantMiddleware chạy trên mọi route) — "public" ở đây nghĩa là **không yêu cầu JWT**.

**Auth:**
- `POST /api/auth/register`
- `POST /api/auth/verify-otp`
- `POST /api/auth/resend-otp`
- `POST /api/auth/forgot-password`
- `PUT /api/auth/reset-password`
- `POST /api/auth/login`
- `POST /api/auth/refresh`

**Public data** (dùng cho `(public)` pages):
- `GET /api/properties` + `GET /api/properties/:id` + `GET /api/properties/code/:propertyCode` + `GET /api/properties/types`
- `GET /api/projects` + `GET /api/projects/:id` + `GET /api/projects/code/:code`
- `GET /api/news` + `GET /api/news/:id` + `GET /api/news/slug/:slug` + `GET /api/news/category/:code` + `GET /api/news-categories`
- `GET /api/locations` + `GET /api/locations/tree` + `GET /api/locations/:id`
- `POST /api/property-contacts` (form liên hệ → tự tạo Customer + Lead; guest → lead pool)
- `GET /api/seo/resolve`
- `GET /api/tenants/domain/:domain` (resolve tenant)
- `GET /api/dashboard/public-stats` (public landing stats)

**System:**
- `GET /api/health` / `health/live` / `health/ready` / `health/metrics`
- `GET /api/docs` (Swagger)

> ⚠️ `POST /api/tenants` và `POST /api/users` **không phải public** — cả hai yêu cầu JWT (`TENANT:CREATE` cho tenants).

### 4.5 Response Format

**Thành công** — trả trực tiếp data object/array.

**Lỗi** — format thống nhất:

```json
{
  "statusCode": 403,
  "message": "Missing permissions: LEAD:UPDATE",
  "error": "Forbidden"
}
```

### 4.6 Pagination

Tất cả endpoint list hỗ trợ:

| Query param | Type | Mặc định | Mô tả |
|-------------|------|----------|-------|
| `limit` | number | 20-50 | Số bản ghi / trang |
| `offset` | number | 0 | Vị trí bắt đầu |

> Response **không trả total count** — FE dùng infinite scroll hoặc estimated pagination.

### 4.7 Soft Delete

Tất cả DELETE endpoint là **soft delete** (set `status: 'INACTIVE'`), không xóa cứng. UI nên ẩn item đã xóa thay vì loại bỏ hoàn toàn.

### 4.8 Permission Format

Permission theo format **`MODULE:ACTION`** (uppercase), trả về trong `GET /api/auth/me` → `permissions[]` (mỗi entry `{ module, action }`). FE check qua CASL: `ability.can('READ_ALL', 'PROPERTY')`.

| Permission | Ý nghĩa |
|------------|---------|
| `PROPERTY:READ` | Xem BĐS (detail) |
| `PROPERTY:READ_OWN` / `PROPERTY:READ_ALL` | Xem list — scope bản thân / toàn tenant |
| `PROPERTY:CREATE` | Tạo BĐS |
| `PROPERTY:UPDATE_OWN` / `PROPERTY:UPDATE_ALL` | Sửa BĐS của mình / mọi BĐS |
| `PROPERTY:DELETE_OWN` / `PROPERTY:DELETE_ALL` | Xóa BĐS của mình / mọi BĐS |
| `PROPERTY:APPROVE` / `PROPERTY:APPROVE_VIEW` | Duyệt / xem màn duyệt BĐS |
| `LEAD:UPDATE_ALL` | Bypass lead protection khi claim/assign |
| `POOL:VIEW` / `POOL:READ` / `POOL:CLAIM` / `POOL:ASSIGN` | Lead pool: xem / chi tiết / tự claim / phân bổ |
| `TEAM:MANAGE_MEMBERS` | Quản lý member trong team mình lead |
| `*` | SUPER_ADMIN — tất cả |

**28 permission modules**: `PROPERTY`, `LEAD`, `CUSTOMER`, `DEAL`, `COMMISSION`, `APPOINTMENT`, `ASSIGNMENT`, `FILE`, `USER`, `ROLE`, `TENANT`, `TEAM`, `POOL`, `WORKFLOW`, `REPORT`, `SETTING`, `DYNAMIC_FIELD`, `LOCATION`, `IMPORT`, `EXPORT`, `AUDIT`, `NOTIFICATION`, `SEO`, `REVALIDATION`, `NEWS`, `PROJECT`, `PROPERTY_CONTACT`, `CONTACT_REQUEST`.

**Actions chuẩn**: `CREATE`, `VIEW`, `READ`, `READ_OWN`, `READ_ALL`, `UPDATE`, `UPDATE_OWN`, `UPDATE_ALL`, `DELETE`, `DELETE_OWN`, `DELETE_ALL`, `APPROVE`, `APPROVE_VIEW`, `EXPORT`, `ASSIGN`, `MANAGE_MEMBERS`, `CLAIM` (tùy module — xem `permissions.config.ts` / endpoint `GET /api/permissions/modules`).

> ⚠️ Đừng dùng format cũ `properties:read` / `leads:write` — đó là draft ban đầu, code thực tế dùng `MODULE:ACTION` uppercase.

---

## 5. Danh sách API Routes

### 5.1 Auth

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `POST` | `/api/auth/register` | - | - | Đăng ký (tạo user + gửi OTP email) |
| `POST` | `/api/auth/verify-otp` | - | - | Xác thực OTP sau register |
| `POST` | `/api/auth/resend-otp` | - | - | Gửi lại OTP |
| `POST` | `/api/auth/forgot-password` | - | - | Gửi link reset password qua email |
| `PUT` | `/api/auth/reset-password` | - | - | Reset password bằng token |
| `POST` | `/api/auth/login` | - | - | Đăng nhập — `identifier` = email **hoặc** username **hoặc** SĐT |
| `POST` | `/api/auth/refresh` | - | - | Refresh access token |
| `GET` | `/api/auth/me` | Bearer | - | Profile hiện tại (bao gồm `permissions` array) |
| `PATCH` / `PUT` | `/api/auth/me` | Bearer | - | Cập nhật profile (fullName, phone, username, dateOfBirth, gender, province, ward, avatar) |
| `PATCH` | `/api/auth/me/password` | Bearer | - | Đổi mật khẩu |
| `POST` | `/api/auth/logout` | Bearer | - | Logout, revoke session + tokens |
| `POST` | `/api/auth/switch-tenant/:tenantId` | Bearer | - | Đổi active tenant (trả token mới) |
| `POST` | `/api/auth/revoke-all-tokens` | Bearer | - | Thu hồi mọi session (bump token_version) |

**Register DTO:**
```json
{
  "fullName": "Nguyen Van A",
  "email": "user@example.com",
  "username": "nguyenvana",
  "password": "SecurePass123!",
  "phone": "0901234567"
}
```

**Login DTO:**
```json
{
  "identifier": "user@example.com",
  "password": "SecurePass123!"
}
```

### 5.2 Users & Memberships

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `POST` | `/api/users` | Bearer + Tenant | - | Tạo user mới trong tenant hiện tại (active ngay) |
| `GET` | `/api/users` | Bearer + Tenant | `USER:READ` | List users |
| `GET` | `/api/users/:id` | Bearer + Tenant | `USER:READ` | Chi tiết user |
| `PATCH` / `PUT` | `/api/users/:id` | Bearer + Tenant | `USER:UPDATE` | Cập nhật user |
| `GET` | `/api/memberships` | Bearer + Tenant | `USER:READ` | List memberships |
| `GET` | `/api/memberships/stats` | Bearer + Tenant | `USER:READ` | Stats: total/active/inactive/newThisMonth |
| `GET` | `/api/memberships/user/:userId` | Bearer + Tenant | `USER:READ` | Memberships của 1 user |
| `PUT` | `/api/memberships/user/:userId` | Bearer + Tenant | `USER:UPDATE` | Gán roles/memberships cho user |
| `PATCH` / `PUT` / `DELETE` | `/api/memberships/:id` | Bearer + Tenant | `USER:UPDATE` | Sửa/xóa membership |

> ⚠️ Profile endpoint là `GET /api/auth/me` — KHÔNG phải `/api/users/me` (route này không tồn tại).

### 5.3 Tenants

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `GET` | `/api/tenants` | Bearer + Tenant | `TENANT:READ` | List tenants (search, type, status) |
| `POST` | `/api/tenants` | Bearer | `TENANT:CREATE` | Tạo tenant mới (SUPER_ADMIN) |
| `GET` | `/api/tenants/:id` | Bearer + Tenant | `TENANT:READ` | Chi tiết tenant |
| `GET` | `/api/tenants/domain/:domain` | - | - | Resolve tenant theo domain |
| `GET` | `/api/tenants/code/:code` | - | - | Resolve tenant theo code (id, name, code, logoUrl, primaryColor) — dùng cho dynamic branding |
| `GET` | `/api/tenants/:id/settings` | Bearer + Tenant | `TENANT:READ` | Settings của tenant |
| `PATCH` | `/api/tenants/:id/settings` | Bearer + Tenant | `TENANT:UPDATE` | Upsert setting |
| `GET` | `/api/tenants/:id/features` | Bearer + Tenant | `TENANT:READ` | Feature flags |
| `PATCH` | `/api/tenants/:id/features` | Bearer + Tenant | `TENANT:UPDATE` | Toggle feature flag |

**Create Tenant DTO:**
```json
{
  "name": "ABC Real Estate",
  "code": "ABC",
  "type": "AGENCY",
  "logoUrl": "https://cdn.realhub.vn/logo.png",
  "primaryColor": "#1a73e8",
  "domains": ["abc.realhub.vn"]
}
```

### 5.4 Locations

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `GET` | `/api/locations` | - (public) | - | List locations (filter: type, level, parentId, search) |
| `GET` | `/api/locations/tree` | - (public) | - | Cây địa lý (query: parentId) |
| `GET` | `/api/locations/:id` | - (public) | - | Chi tiết location |
| `POST` | `/api/locations` | Bearer + Tenant | `LOCATION:CREATE` | Tạo location |
| `PATCH` | `/api/locations/:id` | Bearer + Tenant | `LOCATION:UPDATE` | Cập nhật |
| `DELETE` | `/api/locations/:id` | Bearer + Tenant | `LOCATION:DELETE` | Soft delete |

**Location types:** `COUNTRY`, `PROVINCE`, `DISTRICT`, `WARD`, `STREET`

### 5.5 Properties

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `GET` | `/api/properties` | - (public) | - | List BĐS public (filter đa tiêu chí) |
| `GET` | `/api/properties/admin` | Bearer + Tenant | `PROPERTY:READ` | List BĐS nội bộ (portal) |
| `GET` | `/api/properties/available-for-assignment` | Bearer + Tenant | `ASSIGNMENT:READ` | BĐS sales có thể nhận phụ trách |
| `GET` | `/api/properties/types` | - (public) | - | List loại BĐS |
| `POST` | `/api/properties/types` | Bearer + Tenant | `PROPERTY:CREATE` | Tạo loại BĐS |
| `GET` | `/api/properties/:id` | - (public) | - | Chi tiết BĐS (masking theo role) |
| `GET` | `/api/properties/code/:propertyCode` | - (public) | - | Chi tiết theo propertyCode (SEO URL) |
| `POST` | `/api/properties` | Bearer + Tenant | `PROPERTY:CREATE` | Tạo BĐS |
| `PATCH` | `/api/properties/:id` | Bearer + Tenant | `PROPERTY:UPDATE` | Cập nhật |
| `DELETE` | `/api/properties/:id` | Bearer + Tenant | `PROPERTY:DELETE` | Soft delete |
| `GET` | `/api/properties/:id/transitions` | Bearer + Tenant | `PROPERTY:READ` | Workflow transitions khả dụng |
| `POST` | `/api/properties/:id/transition` | Bearer + Tenant | `PROPERTY:UPDATE` | Chuyển trạng thái (verify, publish...) |
| `GET`/`POST`/`PATCH`/`DELETE` | `/api/properties/:id/media[...]` | Bearer + Tenant | `PROPERTY:CREATE/UPDATE/DELETE` | Media: list, upload, reorder, set-primary |

**Query params cho GET /api/properties:**

| Param | Type | Mô tả |
|-------|------|-------|
| `propertyTypeId` | string (UUID) | Lọc theo loại BĐS |
| `transactionType` | `SALE` \| `RENT` \| `TRANSFER` \| `INVESTMENT` | Loại giao dịch |
| `businessStatus` | `AVAILABLE` \| `RESERVED` \| `SOLD` \| `RENTED` \| `OFF_MARKET` | Trạng thái kinh doanh |
| `publicationStatus` | `PRIVATE` \| `PUBLIC` \| `ARCHIVED` | Trạng thái đăng |
| `provinceId` | UUID | Lọc theo tỉnh |
| `districtId` | UUID | Lọc theo quận |
| `wardId` | UUID | Lọc theo phường |
| `projectId` | UUID | Lọc theo dự án |
| `zoneId` | UUID | Lọc theo khu vực |
| `minPrice` / `maxPrice` | number | Khoảng giá |
| `minArea` / `maxArea` | number | Khoảng diện tích |
| `search` | string | Tìm kiếm tự do |
| `limit` / `offset` | number | Phân trang |

**Create Property DTO (tóm tắt):**
```json
{
  "propertyCode": "PROP-001",
  "title": "Luxury Apartment in District 1",
  "slug": "luxury-apartment-district-1",
  "propertyTypeId": "uuid",
  "transactionType": "SALE",
  "sellingMode": "SELF_SELL",
  "provinceId": "uuid",
  "districtId": "uuid",
  "price": 5000000000,
  "priceUnit": "VND",
  "area": 80,
  "areaUnit": "SQM",
  "latitude": 10.7769,
  "longitude": 106.7009,
  "publicationStatus": "PRIVATE",
  "businessStatus": "AVAILABLE",
  "dynamicValuesJson": {}
}
```

### 5.6 CRM (Customers, Leads)

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `GET` | `/api/customers` | Bearer + Tenant | `CUSTOMER:READ` | List khách hàng |
| `GET` | `/api/customers/admin` | Bearer + Tenant | `CUSTOMER:READ` | List khách hàng (admin view) |
| `GET` | `/api/customers/:id` | Bearer + Tenant | `CUSTOMER:READ` | Chi tiết khách hàng |
| `POST` | `/api/customers` | Bearer + Tenant | `CUSTOMER:CREATE` | Tạo khách hàng |
| `PATCH` | `/api/customers/:id` | Bearer + Tenant | `CUSTOMER:UPDATE` | Cập nhật |
| `DELETE` | `/api/customers/:id` | Bearer + Tenant | `CUSTOMER:DELETE` | Soft delete |
| `GET` | `/api/customers/me` | Bearer + Tenant | `JwtAuthGuard` (own) | Hồ sơ customer của user hiện tại |
| `GET` | `/api/customers/me/needs` | Bearer + Tenant | `JwtAuthGuard` (own) | List nhu cầu của tôi |
| `POST` | `/api/customers/me/needs` | Bearer + Tenant | `JwtAuthGuard` (own) | Tự tạo nhu cầu (customer self-service) |
| `GET` | `/api/customers/me/deals` | Bearer + Tenant | `JwtAuthGuard` (own) | Giao dịch của tôi (theo dõi trạng thái) |
| `GET` | `/api/customers/me/appointments` | Bearer + Tenant | `JwtAuthGuard` (own) | Lịch hẹn của tôi |
| `GET` | `/api/customers/me/contacts` | Bearer + Tenant | `JwtAuthGuard` (own) | Yêu cầu tư vấn tôi đã gửi |
| `GET` | `/api/customer-needs` | Bearer + Tenant | `CUSTOMER:READ` | List nhu cầu (query: customerId) |
| `POST` | `/api/customer-needs` | Bearer + Tenant | `CUSTOMER:CREATE` | Tạo nhu cầu |
| `GET` | `/api/customer-needs/:id/transitions` | Bearer + Tenant | `CUSTOMER:READ` | Workflow transitions |
| `POST` | `/api/customer-needs/:id/transition` | Bearer + Tenant | `CUSTOMER:UPDATE` | Chuyển trạng thái nhu cầu |
| `GET` | `/api/leads` | Bearer + Tenant | `LEAD:READ` | List leads (filter đa tiêu chí) |
| `GET` | `/api/leads/admin` | Bearer + Tenant | `LEAD:READ` | List leads (admin view) |
| `GET` | `/api/leads/pool` | Bearer + Tenant | `POOL:READ` | Lead pool (chưa gán sales/team) |
| `POST` | `/api/leads/:id/claim` | Bearer + Tenant | `POOL:CLAIM` | Sales tự claim lead từ pool |
| `POST` | `/api/leads/:id/assign` | Bearer + Tenant | `POOL:ASSIGN` | Phân bổ lead → sales hoặc team |
| `GET` | `/api/leads/:id` | Bearer + Tenant | `LEAD:READ` | Chi tiết lead |
| `POST` | `/api/leads` | Bearer + Tenant | `LEAD:CREATE` | Tạo lead |
| `PATCH` | `/api/leads/:id` | Bearer + Tenant | `LEAD:UPDATE` | Cập nhật lead (check bảo hộ) |
| `DELETE` | `/api/leads/:id` | Bearer + Tenant | `LEAD:DELETE` | Soft delete |
| `GET` | `/api/leads/:id/transitions` | Bearer + Tenant | `LEAD:READ` | Workflow transitions |
| `POST` | `/api/leads/:id/transition` | Bearer + Tenant | `LEAD:UPDATE` | Chuyển trạng thái lead |
| `GET` | `/api/leads/:id/activities` | Bearer + Tenant | `LEAD:READ` | Hoạt động của lead |
| `POST` | `/api/leads/:id/activities` | Bearer + Tenant | `LEAD:CREATE` | Thêm hoạt động |

**Lead statuses:** `NEW`, `CONTACTED`, `INTERESTED`, `NEGOTIATING`, `CONVERTED`, `LOST`, `RECYCLED`

**Lead sources:** `WEBSITE`, `PROPERTY_DETAIL`, `OWNER_PAGE`, `SALES_LINK`, `CTV_LINK`, `AGENCY_MARKETING`, `MANUAL_INPUT`, `LEAD_POOL`, `IMPORT`

**Lead activity types:** `CALL`, `NOTE`, `MESSAGE`, `SEND_PROPERTY`, `STATUS_CHANGE`, `APPOINTMENT_CREATED`, `DEAL_CREATED`

### 5.6b Property Contacts & Contact Requests

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `POST` | `/api/property-contacts` | - (public, JWT optional) | - | Form liên hệ → auto Customer + Lead; `refCode` resolve sang sales; guest → pool |
| `GET` | `/api/property-contacts` | Bearer + Tenant | `PROPERTY_CONTACT:READ` | Inbox liên hệ (`/consultations`) |
| `GET` | `/api/property-contacts/:id` | Bearer + Tenant | `PROPERTY_CONTACT:READ` | Chi tiết |
| `PATCH` | `/api/property-contacts/:id` | Bearer + Tenant | `PROPERTY_CONTACT:UPDATE` | Cập nhật trạng thái |
| `DELETE` | `/api/property-contacts/:id` | Bearer + Tenant | `PROPERTY_CONTACT:DELETE` | Xóa |
| `POST` | `/api/contact-requests` | - (public) | - | Tạo yêu cầu liên hệ từ public form |
| `GET` | `/api/contact-requests` | Bearer + Tenant | `CONTACT_REQUEST:READ` | List contact requests |
| `GET` | `/api/contact-requests/:id` | Bearer + Tenant | `CONTACT_REQUEST:READ` | Chi tiết |
| `PATCH` | `/api/contact-requests/:id` | Bearer + Tenant | `CONTACT_REQUEST:UPDATE` | Cập nhật |
| `DELETE` | `/api/contact-requests/:id` | Bearer + Tenant | `CONTACT_REQUEST:DELETE` | Xóa |

> Chi tiết luồng contact → lead: `real-hub-be/docs/contact-lead-flow.md`.

### 5.6c Favorites (Lưu sản phẩm)

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `GET` | `/api/favorites` | Bearer + Tenant | `JwtAuthGuard` (own) | List BĐS đã lưu của tôi |
| `GET` | `/api/favorites/ids` | Bearer + Tenant | `JwtAuthGuard` (own) | List propertyId đã lưu (cho heart state) |
| `POST` | `/api/favorites` | Bearer + Tenant | `JwtAuthGuard` (own) | Lưu sản phẩm `{ propertyId }` |
| `DELETE` | `/api/favorites/:propertyId` | Bearer + Tenant | `JwtAuthGuard` (own) | Bỏ lưu |

### 5.6d Teams

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `GET` | `/api/teams` | Bearer + Tenant | `TEAM:READ` | List teams (+ `/api/teams/my` team của mình) |
| `GET` | `/api/teams/:id` | Bearer + Tenant | `TEAM:READ` | Chi tiết team + members |
| `POST` | `/api/teams` | Bearer + Tenant | `TEAM:CREATE` | Tạo team |
| `PATCH` | `/api/teams/:id` | Bearer + Tenant | `TEAM:UPDATE` | Cập nhật team |
| `DELETE` | `/api/teams/:id` | Bearer + Tenant | `TEAM:DELETE` | Xóa team |
| `POST` | `/api/teams/:id/members` | Bearer + Tenant | `TEAM:MANAGE_MEMBERS` | Thêm member |
| `PATCH` | `/api/teams/:id/members/:userId` | Bearer + Tenant | `TEAM:MANAGE_MEMBERS` | Đổi roleInTeam |
| `DELETE` | `/api/teams/:id/members/:userId` | Bearer + Tenant | `TEAM:MANAGE_MEMBERS` | Xóa member |

### 5.7 Appointments & Deals

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `GET` | `/api/appointments` | Bearer + Tenant | `APPOINTMENT:READ` | List lịch hẹn |
| `GET` | `/api/appointments/admin` | Bearer + Tenant | `APPOINTMENT:READ` | List lịch hẹn (admin view) |
| `GET` | `/api/appointments/:id` | Bearer + Tenant | `APPOINTMENT:READ` | Chi tiết |
| `POST` | `/api/appointments` | Bearer + Tenant | `APPOINTMENT:UPDATE` | Tạo lịch hẹn |
| `PATCH` | `/api/appointments/:id` | Bearer + Tenant | `APPOINTMENT:UPDATE` | Cập nhật |
| `DELETE` | `/api/appointments/:id` | Bearer + Tenant | `APPOINTMENT:DELETE` | Soft delete |
| `GET` | `/api/deals` | Bearer + Tenant | `DEAL:READ` | List giao dịch |
| `GET` | `/api/deals/:id` | Bearer + Tenant | `DEAL:READ` | Chi tiết deal |
| `POST` | `/api/deals` | Bearer + Tenant | `DEAL:CREATE` | Tạo deal |
| `PATCH` | `/api/deals/:id` | Bearer + Tenant | `DEAL:UPDATE` | Cập nhật deal |
| `DELETE` | `/api/deals/:id` | Bearer + Tenant | `DEAL:DELETE` | Soft delete |
| `GET` | `/api/deals/:id/transitions` | Bearer + Tenant | `DEAL:READ` | Workflow transitions |
| `POST` | `/api/deals/:id/transition` | Bearer + Tenant | `DEAL:UPDATE` | Chuyển trạng thái deal |
| `GET` | `/api/deals/:id/activities` | Bearer + Tenant | `DEAL:READ` | Hoạt động deal |
| `POST` | `/api/deals/:id/activities` | Bearer + Tenant | `DEAL:CREATE` | Thêm hoạt động |
| `GET` | `/api/reservations` | Bearer + Tenant | `DEAL:READ` | List giữ chỗ (SOFT/HARD) |
| `POST` | `/api/reservations` | Bearer + Tenant | `DEAL:CREATE` | Tạo giữ chỗ |
| `PATCH` | `/api/reservations/:id/approve` | Bearer + Tenant | `DEAL:APPROVE` | Duyệt giữ chỗ |
| `PATCH` | `/api/reservations/:id/reject` | Bearer + Tenant | `DEAL:APPROVE` | Từ chối giữ chỗ |

**Appointment types:** `MEETING`, `CALL`, `SITE_VISIT`, `SIGNING`

**Deal transaction types:** `SALE`, `RENT`, `TRANSFER`

**Deal activity types:** `NOTE`, `STATUS_CHANGE`, `CALL`, `EMAIL`, `MEETING`, `DOCUMENT`

**Reservation types:** `SOFT`, `HARD`

### 5.8 Commission

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `GET` | `/api/commission/plans` | Bearer + Tenant | `COMMISSION:READ` | List kế hoạch hoa hồng |
| `GET` | `/api/commission/plans/:id` | Bearer + Tenant | `COMMISSION:READ` | Chi tiết plan |
| `POST` | `/api/commission/plans` | Bearer + Tenant | `COMMISSION:CREATE` | Tạo plan (kèm rules + splits) |
| `PATCH` | `/api/commission/plans/:id` | Bearer + Tenant | `COMMISSION:CREATE` | Cập nhật plan |
| `PATCH` | `/api/commission/plans/:id/status` | Bearer + Tenant | `COMMISSION:APPROVE` | Duyệt/đổi trạng thái plan |
| `DELETE` | `/api/commission/plans/:id` | Bearer + Tenant | `COMMISSION:APPROVE` | Xóa plan |
| `GET` | `/api/commission/deals` | Bearer + Tenant | `COMMISSION:READ` | List deal commissions |
| `GET` | `/api/commission/deals/:id` | Bearer + Tenant | `COMMISSION:READ` | Chi tiết deal commission |
| `POST` | `/api/commission/deals` | Bearer + Tenant | `COMMISSION:CREATE` | Tạo deal commission (**estimate** theo plan đang active) |
| `PATCH` | `/api/commission/deals/:id` | Bearer + Tenant | `COMMISSION:APPROVE` | Điều chỉnh deal commission |
| `DELETE` | `/api/commission/deals/:id` | Bearer + Tenant | `COMMISSION:APPROVE` | Xóa deal commission |
| `POST` | `/api/commission/deals/:id/confirm` | Bearer + Tenant | `COMMISSION:APPROVE` | Xác nhận hoa hồng |
| `POST` | `/api/commission/deals/:id/approve` | Bearer + Tenant | `COMMISSION:APPROVE` | Duyệt hoa hồng |
| `POST` | `/api/commission/deals/:id/reject` | Bearer + Tenant | `COMMISSION:APPROVE` | Từ chối hoa hồng |
| `POST` | `/api/commission/deals/:id/mark-paid` | Bearer + Tenant | `COMMISSION:APPROVE` | Đánh dấu đã chi (ghi nhận thủ công, không payout online) |

**Plan statuses:** `DRAFT`, `PENDING_APPROVAL`, `ACTIVE`, `ARCHIVED`

**Calculation types:** `PERCENT`, `FIXED`

**Calculation bases:** `EXPECTED_VALUE`, `ACTUAL_VALUE`, `NET_VALUE`

**Split types:** `PERCENT`, `FIXED`

### 5.9 Workflow

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `GET` | `/api/workflows` | Bearer + Tenant | `WORKFLOW:READ` | List workflow definitions |
| `GET` | `/api/workflows/entity-status-fields` | Bearer + Tenant | `WORKFLOW:READ` | Trường status của từng entity |
| `GET` | `/api/workflows/:id` | Bearer + Tenant | `WORKFLOW:READ` | Chi tiết workflow |
| `POST` | `/api/workflows` | Bearer + Tenant | `WORKFLOW:CREATE` | Tạo workflow (states + transitions) |
| `PUT` | `/api/workflows/:id` | Bearer + Tenant | `WORKFLOW:UPDATE` | Cập nhật workflow |
| `DELETE` | `/api/workflows/:id` | Bearer + Tenant | `WORKFLOW:DELETE` | Xóa workflow |

### 5.10 File Upload

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `POST` | `/api/files/upload` | Bearer + Tenant | `FILE:CREATE` | Upload 1 file (multipart/form-data) |
| `POST` | `/api/files/upload-multiple` | Bearer + Tenant | `FILE:CREATE` | Upload nhiều file (tối đa 10) |
| `POST` | `/api/files/temp-upload` | Bearer + Tenant | `FILE:CREATE` | Upload tạm (chưa gắn owner) |
| `POST` | `/api/files/:id/confirm` | Bearer + Tenant | `FILE:CREATE` | Confirm file tạm → chính thức |
| `DELETE` | `/api/files/:id/abort` | Bearer + Tenant | `FILE:DELETE` | Hủy file tạm |
| `GET` | `/api/files` | Bearer + Tenant | `FILE:READ` | List files (filter: ownerType, ownerId, visibility) |
| `GET` | `/api/files/admin` | Bearer + Tenant | `FILE:READ` | List files (admin view) |
| `GET` | `/api/files/:id` | Bearer + Tenant | `FILE:READ` | Metadata file |
| `GET` | `/api/files/:id/download` | Bearer + Tenant | `FILE:READ` | Presigned download URL |
| `PATCH` | `/api/files/:id/visibility` | Bearer + Tenant | `FILE:UPDATE` | Đổi visibility |
| `DELETE` | `/api/files/:id` | Bearer + Tenant | `FILE:DELETE` | Soft delete |

**File visibility levels:** `PUBLIC`, `TENANT`, `ASSIGNED`, `PRIVATE`, `SENSITIVE`

**Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`, `video/mp4`

**Max file size:** 50MB (52,428,800 bytes)

### 5.11 Lead Protection

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `GET` | `/api/lead-protection/policies` | Bearer + Tenant | `LEAD:READ` | List chính sách bảo hộ |
| `GET` | `/api/lead-protection/policies/:id` | Bearer + Tenant | `LEAD:READ` | Chi tiết policy |
| `POST` | `/api/lead-protection/policies` | Bearer + Tenant | `LEAD:CREATE` | Tạo policy |
| `PATCH` | `/api/lead-protection/policies/:id` | Bearer + Tenant | `LEAD:UPDATE` | Cập nhật |
| `DELETE` | `/api/lead-protection/policies/:id` | Bearer + Tenant | `LEAD:DELETE` | Xóa policy |
| `GET` | `/api/lead-protection/check/:leadId` | Bearer + Tenant | `LEAD:READ` | Kiểm tra bảo hộ lead |
| `POST` | `/api/lead-protection/disputes` | Bearer + Tenant | `LEAD:CREATE` | Tạo tranh chấp |
| `GET` | `/api/lead-protection/disputes` | Bearer + Tenant | `LEAD:READ` | List tranh chấp |
| `PATCH` | `/api/lead-protection/disputes/:id/resolve` | Bearer + Tenant | `LEAD:APPROVE` ⚠️ | Giải quyết tranh chấp — ⚠️ `LEAD:APPROVE` chưa có trong permission config (chỉ SUPER_ADMIN `*` gọi được) |

### 5.12 Visibility Policies

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `GET` | `/api/visibility-policies` | Bearer + Tenant | `SETTING:READ` | List policies |
| `GET` | `/api/visibility-policies/:id` | Bearer + Tenant | `SETTING:READ` | Chi tiết |
| `POST` | `/api/visibility-policies` | Bearer + Tenant | `SETTING:CREATE` | Tạo policy + rules |
| `PATCH` | `/api/visibility-policies/:id` | Bearer + Tenant | `SETTING:UPDATE` | Cập nhật |
| `DELETE` | `/api/visibility-policies/:id` | Bearer + Tenant | `SETTING:DELETE` | Xóa |
| `POST` | `/api/visibility-policies/:id/rules` | Bearer + Tenant | `SETTING:CREATE` | Thêm field rule |
| `DELETE` | `/api/visibility-policies/rules/:ruleId` | Bearer + Tenant | `SETTING:DELETE` | Xóa field rule |

### 5.13 Dynamic Fields

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `GET` | `/api/dynamic-fields/groups` | Bearer + Tenant | - | List field groups |
| `POST` | `/api/dynamic-fields/groups` | Bearer + Tenant | `DYNAMIC_FIELD:CREATE` | Tạo group |
| `PATCH`/`DELETE` | `/api/dynamic-fields/groups/:id` | Bearer + Tenant | `DYNAMIC_FIELD:UPDATE/DELETE` | Sửa/xóa group |
| `PUT` | `/api/dynamic-fields/groups/:id/fields` | Bearer + Tenant | `DYNAMIC_FIELD:UPDATE` | Gán fields vào group |
| `GET` | `/api/dynamic-fields/definitions` | Bearer + Tenant | - | List field definitions |
| `POST` | `/api/dynamic-fields/definitions` | Bearer + Tenant | `DYNAMIC_FIELD:CREATE` | Tạo definition + options |
| `PATCH`/`DELETE` | `/api/dynamic-fields/definitions/:id` | Bearer + Tenant | `DYNAMIC_FIELD:UPDATE/DELETE` | Sửa/xóa definition |
| `GET` | `/api/dynamic-fields/form-schemas` | Bearer + Tenant | - | List form schemas (entityType: PROPERTY/LEAD/DEAL) |
| `POST` | `/api/dynamic-fields/form-schemas` | Bearer + Tenant | `DYNAMIC_FIELD:CREATE` | Tạo form schema |
| `PATCH`/`DELETE` | `/api/dynamic-fields/form-schemas/:id` | Bearer + Tenant | `DYNAMIC_FIELD:UPDATE/DELETE` | Sửa/xóa form schema |

### 5.14 Projects

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `GET` | `/api/projects` | - (public) | - | List dự án |
| `GET` | `/api/projects/:id` | - (public) | - | Chi tiết dự án |
| `GET` | `/api/projects/code/:code` | - (public) | - | Chi tiết theo code (SEO URL) |
| `POST` | `/api/projects` | Bearer + Tenant | `PROJECT:CREATE` | Tạo dự án |
| `PATCH`/`DELETE` | `/api/projects/:id` | Bearer + Tenant | `PROJECT:UPDATE/DELETE` | Sửa/xóa dự án |
| `GET`/`POST`/`PATCH`/`DELETE` | `/api/projects/:id/media[...]` | Bearer + Tenant | `PROJECT:UPDATE` | Media dự án |

### 5.15 Assignments

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `GET` | `/api/assignments` | Bearer + Tenant | `ASSIGNMENT:READ` | List assignments |
| `GET` | `/api/assignments/mine` | Bearer + Tenant | `ASSIGNMENT:READ` | Sản phẩm tôi phụ trách |
| `GET` | `/api/assignments/expired` | Bearer + Tenant | `ASSIGNMENT:READ` | Assignment hết hạn |
| `GET` | `/api/assignments/:id` | Bearer + Tenant | `ASSIGNMENT:READ` | Chi tiết |
| `POST` | `/api/assignments` | Bearer + Tenant | `ASSIGNMENT:CREATE` | Nhận phụ trách (tạo `publicLinkCode`) |
| `GET` | `/api/assignments/:id/qr` | Bearer + Tenant | `ASSIGNMENT:READ` | QR SVG cho public link (CTV/sales chia sẻ) |
| `GET` | `/api/assignments/link/:code` | - (public) | - | Resolve assignment theo public link |
| `PATCH` | `/api/assignments/:id/revoke` | Bearer + Tenant | `ASSIGNMENT:UPDATE` | Thu hồi phụ trách |
| `PATCH` | `/api/assignments/:id/extend` | Bearer + Tenant | `ASSIGNMENT:UPDATE` | Gia hạn |
| `POST` | `/api/assignments/expire` | Bearer + Tenant | `ASSIGNMENT:UPDATE` | Expire thủ công |
| `GET`/`POST`/`PATCH`/`DELETE` | `/api/assignments/policies[...]` | Bearer + Tenant | `SETTING:*` | Assignment policies (max sales, thời hạn, expire behavior) |

### 5.16 Revalidation

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `GET`/`POST`/`PATCH`/`DELETE` | `/api/revalidation/policies[...]` | Bearer + Tenant | `SETTING:*` | Revalidation policies |
| `GET` | `/api/revalidation/tasks` | Bearer + Tenant | `PROPERTY:READ` | List revalidation tasks |
| `POST` | `/api/revalidation/tasks` | Bearer + Tenant | `PROPERTY:CREATE` | Tạo task |
| `PATCH` | `/api/revalidation/tasks/:id/complete` | Bearer + Tenant | `PROPERTY:UPDATE` | Hoàn thành task |
| `POST` | `/api/revalidation/expire-overdue` | Bearer + Tenant | `PROPERTY:UPDATE` | Expire sản phẩm quá hạn |
| `GET` | `/api/properties/:propertyId/price-history` | Bearer + Tenant | `PROPERTY:READ` | Lịch sử giá |
| `GET` | `/api/properties/:propertyId/status-history` | Bearer + Tenant | `PROPERTY:READ` | Lịch sử trạng thái |

> ✅ FE đã có settings page `settings/revalidation` (list + create/edit dialog + delete confirm).

### 5.17 SEO

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `GET` | `/api/seo/resolve` | - (public) | - | Resolve SEO metadata động theo pageType + context |
| `GET`/`POST`/`PATCH`/`DELETE` | `/api/seo/templates[...]` | Bearer + Tenant | `SETTING:*` | SEO templates CRUD |

### 5.18 Notifications

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `GET` | `/api/notifications` | Bearer + Tenant | - | List notification của tôi |
| `GET` | `/api/notifications/unread-count` | Bearer + Tenant | - | Số chưa đọc |
| `PATCH` | `/api/notifications/:id/read` | Bearer + Tenant | - | Đánh dấu đã đọc |
| `POST` | `/api/notifications/mark-all-read` | Bearer + Tenant | - | Đọc tất cả |
| `GET`/`POST`/`PATCH`/`DELETE` | `/api/notifications/rules[...]` | Bearer + Tenant | `SETTING:*` | Notification rules |
| `GET`/`POST`/`PATCH`/`DELETE` | `/api/notifications/templates[...]` | Bearer + Tenant | `SETTING:*` | Notification templates |

### 5.19 News

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `GET` | `/api/news` | - (public) | - | List tin tức |
| `GET` | `/api/news/:id`, `/slug/:slug`, `/category/:code` | - (public) | - | Chi tiết/theo slug/theo category |
| `POST`/`PATCH`/`DELETE` | `/api/news[...]` | Bearer + Tenant | `NEWS:*` | Admin CRUD tin tức |
| `GET`/`POST`/`PATCH`/`DELETE` | `/api/news-categories[...]` | Bearer + Tenant | `NEWS:*` | CRUD danh mục |

### 5.20 Reports / Dashboard / Audit / Import-Export

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `GET` | `/api/reports/sales` | Bearer + Tenant | `REPORT:READ` | Báo cáo sales |
| `GET` | `/api/reports/commission` | Bearer + Tenant | `REPORT:READ` | Báo cáo hoa hồng |
| `GET` | `/api/reports/properties` | Bearer + Tenant | `REPORT:READ` | Báo cáo sản phẩm |
| `GET` | `/api/reports/team-performance` | Bearer + Tenant | `REPORT:READ` | Hiệu suất team |
| `GET` | `/api/dashboard/summary`, `/recent-leads`, `/charts` | Bearer + Tenant | - | Dashboard data |
| `GET` | `/api/dashboard/public-stats` | - (public) | - | Stats trang chủ public |
| `GET` | `/api/audit-logs`, `/summary`, `/:id` | Bearer + Tenant | `AUDIT:READ` | Audit log query |
| `GET`/`POST`/`PATCH` | `/api/imports[...]` | Bearer + Tenant | `IMPORT:*` | Import jobs |
| `GET`/`POST`/`PATCH` | `/api/exports[...]` | Bearer + Tenant | `EXPORT:*` | Export jobs |

### 5.21 Roles & Permissions

| Method | Endpoint | Auth | Permission | Mô tả |
|--------|----------|------|------------|-------|
| `GET` | `/api/roles` | Bearer + Tenant | `ROLE:READ` | List roles |
| `GET` | `/api/roles/:id` | Bearer + Tenant | `ROLE:READ` | Chi tiết role |
| `POST`/`PATCH`/`DELETE` | `/api/roles[...]` | Bearer + Tenant | `ROLE:CREATE/UPDATE/DELETE` | CRUD role |
| `PUT` | `/api/roles/:id/permissions` | Bearer + Tenant | `ROLE:UPDATE` | Gán permissions cho role |
| `GET`/`POST`/`DELETE` | `/api/roles/:id/users[...]` | Bearer + Tenant | `ROLE:READ/UPDATE` | User ↔ role |
| `GET` | `/api/permissions` | Bearer + Tenant | `TENANT:READ` | Permission matrix 28 modules |

### 5.22 Health

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| `GET` | `/api/health` | - | Basic health check |
| `GET` | `/api/health/live` | - | Liveness probe |
| `GET` | `/api/health/ready` | - | Readiness probe (DB + Redis) |
| `GET` | `/api/health/metrics` | - | Process metrics |

> Tổng ~**284 endpoints** — luôn đối chiếu Swagger `/api/docs` cho schema mới nhất.

---

## 6. Data Masking & Visibility

BE tự động **mask dữ liệu nhạy cảm** dựa trên role thông qua `DataMaskingInterceptor`. FE cần xử lý:

| Mask type | Ví dụ | FE xử lý |
|-----------|-------|----------|
| `phone` | `090****567` | Hiển thị như nhận được, không cần unmask |
| `price` | `********` | Hiện placeholder "Liên hệ" hoặc "Không có quyền xem" |
| `address` | `District 1, ****` | Hiển thị partial |
| `partial_text` | `Luxury****` | Hiển thị như nhận được |

> **Lưu ý:** FE KHÔNG cần tự mask. BE đã mask trước khi trả về. FE chỉ cần hiển thị đúng dữ liệu nhận được.

### Ma trận hiển thị theo role (tham khảo)

| Loại dữ liệu | Khách | Sales chưa phụ trách | Sales phụ trách | Owner | Agency/Admin/Operator |
|--------------|-------|---------------------|-----------------|-------|----------------------|
| Giá hiển thị, diện tích, mô tả public | Xem | Xem | Xem | Xem | Xem/Sửa |
| Địa chỉ chính xác | Ẩn/rút gọn | Ẩn | Theo quyền | Xem sản phẩm của mình | Xem |
| SĐT chủ BĐS | Ẩn | Ẩn | Theo quyền/log | Xem | Xem/log |
| Giá net/biên thương lượng | Ẩn | Ẩn | Theo quyền | Theo cấu hình | Xem |
| File pháp lý/hợp đồng | Ẩn | Ẩn | Theo quyền/log | Theo cấu hình | Xem/log |
| Lead/khách hàng | Chỉ của mình | Không | Lead của mình | Lead sản phẩm của mình | Theo tenant/quyền |

---

## 7. Auth Flow tích hợp

```
┌──────────────────────────────────────────────────────────────┐
│  FE                                                          │
│                                                              │
│  1. User nhập identifier (email/username/SĐT) + password    │
│  2. POST /api/auth/login                                     │
│     → Nhận { accessToken, refreshToken, user }              │
│  3. Lưu tokens:                                              │
│     - accessToken → Zustand store (memory)                   │
│     - refreshToken → localStorage (persist qua reload)       │
│     - user → Zustand store                                   │
│  4. Mọi request sau đó:                                     │
│     - Header: Authorization: Bearer <accessToken>            │
│     - Header: x-tenant-code: <tenantCode>                    │
│  5. Khi accessToken hết hạn (401):                          │
│     - POST /api/auth/refresh { refreshToken }                │
│     → Nhận tokens mới → retry request                        │
│  6. Logout:                                                  │
│     - POST /api/auth/logout                                  │
│     - Clear tokens (Zustand + localStorage), redirect /login │
└──────────────────────────────────────────────────────────────┘
```

### API client setup (gợi ý)

```typescript
// api client tự động attach headers + refresh
const apiClient = axios.create({ baseURL: '/api' });

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  const tenantCode = useAuthStore.getState().tenantCode;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenantCode) config.headers['x-tenant-code'] = tenantCode;
  return config;
});

// Auto refresh on 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const { refreshToken } = useAuthStore.getState();
      const { data } = await axios.post('/api/auth/refresh', { refreshToken });
      useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
      return apiClient(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

## 8. UI/UX

### 8.1 Layout tổng thể

```
┌─────────────────────────────────────────────────────┐
│  TopBar: Logo | Tenant Switcher | User Menu         │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Sidebar  │  Main Content Area                       │
│          │                                          │
│ - Dashboard                                          │
│ - Properties                                         │
│ - CRM (Customers/Leads)                              │
│ - Appointments                                       │
│ - Deals                                              │
│ - Commission                                         │
│ - Workflows                                          │
│ - Settings                                           │
│          │                                          │
├──────────┴──────────────────────────────────────────┤
│  Footer: Version | Status                           │
└─────────────────────────────────────────────────────┘
```

### 8.2 Các trang chính

> Route thực tế: `/{locale}/{portal}/...` với `portal ∈ {dashboard, sales-portal, owner-portal, customer-portal}` (dynamic segment `[portal]`, config `config/portal-entry.ts` — CUSTOMER resolve về `customer-portal`). Bảng dưới viết tắt prefix `[portal]/`.

| Trang | Route (FE) | Module BE | UI chính |
|-------|------------|-----------|----------|
| **Dashboard** | `[portal]/` | Dashboard | Stats cards + Recharts, recent leads, portal-aware |
| **Login** | `/login` | Auth | Form login (identifier: email/username/SĐT) |
| **Register** | `/register` | Auth | Form đăng ký → OTP |
| **Verify OTP** | `/verify-otp` | Auth | Nhập OTP xác thực email |
| **Forgot Password** | `/forgot-password` | Auth | Gửi link reset + form reset |
| **Properties** | `[portal]/properties` | Properties | List/new/detail/edit + workflow + submit-verification |
| **Projects** | `[portal]/projects` | Projects | List/new/detail/edit |
| **Customers** | `[portal]/customers` | CRM | List/new/detail/edit + workflow actions |
| **Leads** | `[portal]/leads` | CRM | Kanban + list toggle + dynamic values section |
| **Lead Pool** | `[portal]/pool` | Leads (POOL) | Unassigned leads + claim (`POOL:CLAIM`) |
| **Phân bổ lead** | `[portal]/pool-assign` | Leads (POOL) | Assign pool lead → sales/team (`POOL:ASSIGN`) |
| **Teams** | `[portal]/teams` + `/teams/:id` | Teams | Card grid + members (TEAM:MANAGE_MEMBERS) |
| **Appointments** | `[portal]/appointments` | Appointments | List/new/detail/edit |
| **Deals** | `[portal]/deals` | Deals + Workflow | Kanban + list + reservation + dynamic values |
| **Commission** | `[portal]/commission` | Commission | → deals estimate; báo cáo gom vào `/reports?tab=commission` |
| **Commission Settings** | `[portal]/settings/commissions` | Commission | Plan + rule + split + status workflow |
| **Consultations** | `[portal]/consultations` | Property Contacts | Inbox liên hệ |
| **Contact Requests** | `[portal]/contact-requests` | Contact Requests | List + filter + detail dialog |
| **My Properties** | `[portal]/my-properties` | Properties | Owner view |
| **Available Properties** | `[portal]/available-properties` | Assignments | Sales view + nhận phụ trách |
| **Favorites** | `[portal]/favorites` | Favorites | BĐS đã lưu (customer portal) |
| **My Needs** | `[portal]/my-needs` | Customers /me | Nhu cầu của tôi + create dialog |
| **My Deals** | `[portal]/my-deals` | Customers /me | Giao dịch của tôi (track status) |
| **My Contacts** | `[portal]/my-contacts` | Customers /me | Yêu cầu tư vấn đã gửi |
| **Verification** | `[portal]/verification` | Properties | Duyệt BĐS (`PROPERTY:APPROVE_VIEW`) |
| **Files** | `[portal]/files` | Files | File manager grid + file-card |
| **News** | `[portal]/news` | News | List + categories + Jodit editor + thumbnail |
| **Roles** | `[portal]/roles` | Roles | List + permission dialog + users tab |
| **Users** | `[portal]/users` | Users | List + create/edit dialog |
| **Tenants** | `[portal]/tenants` | Tenants | DataTable + detail dialog (domains, features, settings, branding) |
| **Audit Logs** | `[portal]/audit-logs` | Audit | DataTable + filters + before/after JSON |
| **Reports** | `[portal]/reports` | Reports | 4 tabs: sales, commission, properties, team |
| **Workflows** | `[portal]/settings/workflows` | Workflow | Card + dialog form (chưa có drag-drop editor) |
| **Locations** | `[portal]/settings/locations` | Locations | Tree + CRUD |
| **Dynamic Fields** | `[portal]/settings/dynamic-fields` | Dynamic Fields | definitions/groups/form-schemas (PROPERTY/LEAD/DEAL) |
| **Visibility Policies** | `[portal]/settings/visibility` | Visibility | Policy list + rule editor |
| **Lead Protection** | `[portal]/settings/lead-protection` | Lead Protection | Policy + disputes (đang ẩn trong settings index) |
| **Assignment Policies** | `[portal]/settings/assignment-policies` | Assignments | Policy card + form dialog |
| **SEO Templates** | `[portal]/settings/seo` | SEO | DataTable + edit dialog + context registry |
| **Notification Rules** | `[portal]/settings/notifications` | Notifications | Rules + templates tabs |
| **Revalidation Policies** | `[portal]/settings/revalidation` | Revalidation | Policy list + create/edit dialog + delete confirm |
| **Settings** | `[portal]/settings` | Tenants | Index các trang cài đặt |
| **User Profile** | `[portal]/profile` | Auth | Info + summary + change password |

### 8.3 UI Components đặc thù

**Kanban Board (Leads/Deals):**
- Cột = trạng thái (NEW → CONTACTED → INTERESTED → NEGOTIATING → CONVERTED/LOST)
- Drag & drop để chuyển trạng thái (gọi `PATCH /api/leads/:id` với status mới)
- Card hiển thị: tên khách, phone (masked), giá, ngày tạo, assigned sales avatar

**Property Filter Sidebar:**
- Cascading select: Tỉnh → Quận → Phường (gọi `/api/locations` với parentId)
- Range slider cho giá (dual-thumb `price-range-slider.tsx`) + input diện tích (minArea/maxArea)
- Select dự án (`GET /api/projects` public → `projectId` param)
- Checkbox cho transactionType, property types
- Toggle Map/List view (`listings-map-view.tsx`, Leaflet `ssr: false`)

**Favorites:** `FavoriteButton` overlay trên `PropertyCard` (top-right heart, chỉ render khi `isAuthenticated`) + trang `[portal]/favorites`.

**Dynamic Form Renderer:**
- Fetch `/api/dynamic-fields/form-schemas?entityType=PROPERTY`
- Render form dựa trên `FormSchemaField[]` với điều kiện `conditionJson`
- Support field types: text, number, select, multi-select, date, boolean, textarea

**Commission Calculator:**
- Form nhập dealId, propertyId, transactionValueEstimated
- Gọi `POST /api/commission/deals` (tạo deal commission = estimate theo plan đang active)
- Hiển thị breakdown: total commission → splits per role

**Workflow Visual Editor:**
- Nodes = states (màu khác nhau cho initial/final)
- Edges = transitions (label = actionLabel)
- Drag để tạo transition mới

**File Upload Zone:**
- Drag & drop area (react-dropzone)
- Preview thumbnail cho image
- Progress bar per file
- Visibility selector dropdown
- Gọi `POST /api/files/upload` (multipart/form-data)

### 8.4 Responsive & Theme

- **Desktop** (≥1280px): Full sidebar + content
- **Tablet** (768-1279px): Collapsible sidebar, content full width
- **Mobile** (<768px): Bottom navigation, stacked layout, drawer cho filters
- **Dark mode**: shadcn/ui hỗ trợ sẵn, toggle trong user menu
- **Branding**: `TenantBranding` (`components/shared/tenant-branding.tsx`) fetch tenant qua public endpoint `GET /api/tenants/code/:code` → apply `primaryColor` lên CSS var `--primary`; `logoUrl` dùng cho header/footer branding

---

## 9. FE Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/           # i18n locale segment (next-intl)
│   │   ├── (auth)/         # Auth pages (login, register, verify-otp, forgot-password)
│   │   ├── (public)/       # Public marketing pages (home, about, contact, listings, news, projects)
│   │   └── [portal]/       # Protected pages — dynamic portal segment
│   │       │               #   portal ∈ {dashboard, sales-portal, owner-portal, customer-portal}
│   │       │               #   (config/portal-entry.ts — sidebar theo role + permission)
│   │       ├── (dashboard)/# Dashboard home (stats cards, charts)
│   │       ├── properties/ # Bất động sản (list + new + [id] + [id]/edit)
│   │       ├── projects/   # Dự án
│   │       ├── customers/  # Khách hàng
│   │       ├── leads/      # Leads (Kanban)
│   │       ├── pool/       # Lead pool (claim)
│   │       ├── pool-assign/# Phân bổ lead → sales/team
│   │       ├── teams/      # Teams (+ [id] detail, members)
│   │       ├── appointments/ # Lịch hẹn
│   │       ├── deals/      # Giao dịch (Kanban + reservation)
│   │       ├── commission/ # Hoa hồng (→ deals estimate)
│   │       ├── consultations/ # Inbox liên hệ (property-contacts)
│   │       ├── contact-requests/ # Yêu cầu liên hệ
│   │       ├── my-properties/   # Owner view
│   │       ├── available-properties/ # Sales view (nhận phụ trách)
│   │       ├── favorites/  # BĐS đã lưu (customer)
│   │       ├── my-needs/   # Nhu cầu của tôi (customer)
│   │       ├── my-deals/   # Giao dịch của tôi (customer)
│   │       ├── my-contacts/# Yêu cầu tư vấn đã gửi (customer)
│   │       ├── verification/    # Duyệt BĐS
│   │       ├── news/       # Tin tức (news + categories)
│   │       ├── roles/      # Roles + permission matrix
│   │       ├── users/      # Users
│   │       ├── tenants/    # Tenants (domains, features, settings, branding)
│   │       ├── audit-logs/ # Audit log
│   │       ├── reports/    # Báo cáo (4 tabs)
│   │       ├── files/      # Tài liệu
│   │       ├── profile/    # Hồ sơ người dùng
│   │       └── settings/   # Cài đặt (workflows, locations, dynamic-fields, visibility,
│   │                       #   lead-protection, assignment-policies, commissions,
│   │                       #   seo, notifications, revalidation)
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles + CSS variables
├── components/
│   ├── ui/                 # Base primitives (button, card, input, ...)
│   ├── layout/             # Layout components (sidebar, topbar, footer, 4 portal configs)
│   ├── sections/           # Landing page sections (hero, featured, ...)
│   └── shared/             # Shared business components
├── lib/
│   ├── api/                # Orval generated: endpoints/ + models/ + mutator/custom-instance.ts
│   ├── stores/             # Zustand stores (auth, user)
│   ├── hooks/              # Custom hooks (useTheme, use-sync-profile, ...)
│   └── utils/              # Utilities (cn, formatters, seo-context, ...)
├── i18n/                   # next-intl config + messages/ (27 namespaces, en/vi)
├── providers/              # Context providers (react-query, ability, ...)
└── config/                 # App config (nav items, portal-entry, casl/ability, permissions)
```

---

## 10. Environment Setup (Dev)

### Backend (để FE chạy được)

```bash
# 1. Clone & install
git clone <repo-url> real-hub-be
cd real-hub-be
pnpm install

# 2. Copy env
cp .env.example .env

# 3. Start infrastructure (PostgreSQL, Redis, MinIO)
docker-compose up -d

# 4. Run Prisma migrations + seed
pnpm prisma migrate deploy
pnpm prisma db seed

# 5. Start dev server
pnpm start:dev
# → API: http://localhost:3001/api
# → Swagger: http://localhost:3001/api/docs
```

### Seed accounts

| Email | Password | Role |
|-------|----------|------|
| `admin@demo.realhub.local` | `Admin@123456` | SUPER_ADMIN |
| `sales@demo.realhub.local` | `Sales@123456` | SALES |

**Tenant code (dev):** `DEMO`

### Frontend env

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_TENANT_CODE=DEMO
NEXT_PUBLIC_SWAGGER_URL=http://localhost:3001/api/docs
```

---

## 11. Lưu ý quan trọng cho FE

1. **Tenant header bắt buộc** — Mọi API request (trừ public routes) phải gửi `x-tenant-code` header. Nếu thiếu → `404 Tenant not found`.

2. **Token expiry** — Access token hết hạn sau 15 phút. Cần implement auto-refresh bằng interceptor (xem mục 7).

3. **Data masking** — Dữ liệu trả về có thể đã bị mask (phone, price, address). KHÔNG cố gắng unmask ở FE.

4. **Soft delete** — DELETE endpoint chỉ set `status: INACTIVE`. UI nên ẩn item đã xóa thay vì loại bỏ hoàn toàn.

5. **Dynamic fields** — Form tạo/sửa property phải render động từ API `/api/dynamic-fields/form-schemas`. Không hardcode fields.

6. **Workflow states** — Deal/Lead status có thể thay đổi theo tenant. Cần fetch `/api/workflows` để lấy states + transitions thay vì hardcode.

7. **File upload** — Dùng `multipart/form-data`, field name là `file` (single) hoặc `files` (multiple). Tối đa 10 files/request, 50MB/file.

8. **Permission-based UI** — Ẩn/hiện button, menu item dựa trên permission của user. Lấy từ `GET /api/auth/me` (response bao gồm `permissions` array, format `MODULE:ACTION` — xem §4.8).

9. **Pagination** — Tất cả endpoint list dùng `limit` + `offset` (không phải page/pageSize). Response không trả total count — FE cần dùng infinite scroll hoặc estimated pagination.

10. **Swagger** — Luôn tham khảo `/api/docs` để xem schema chi tiết, request/response examples mới nhất.
