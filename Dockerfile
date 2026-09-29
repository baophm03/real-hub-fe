# ── Bước 1: Base image ─────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# ── Bước 2: Cài pnpm ────────────────────────────────
RUN corepack enable && corepack prepare pnpm@11.10.0 --activate

# ── Bước 3: Copy file cấu hình trước (tối ưu cache) ─
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY next.config.ts postcss.config.mjs tsconfig.json components.json ./

# ── Bước 4: Cài dependencies ────────────────────────
RUN pnpm install --frozen-lockfile

# ── Bước 5: NEXT_PUBLIC_* phải bake lúc build ───────
# Không default: thiếu --build-arg là fail ngay, tránh bake nhầm link cũ
ARG NEXT_PUBLIC_FRONTEND_HOST
ARG NEXT_PUBLIC_BACKEND_HOST
ENV NEXT_PUBLIC_FRONTEND_HOST=$NEXT_PUBLIC_FRONTEND_HOST
ENV NEXT_PUBLIC_BACKEND_HOST=$NEXT_PUBLIC_BACKEND_HOST

# ── Bước 6: Copy code + build ───────────────────────
COPY . .
RUN pnpm build

# ── Bước 7: Xóa devDependencies thừa ────────────────
RUN pnpm prune --prod

# ═══════════════════════════════════════════════════
# Runner
# ═══════════════════════════════════════════════════
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package.json ./

EXPOSE 8101

CMD ["node_modules/.bin/next", "start", "-p", "8101", "-H", "0.0.0.0"]
