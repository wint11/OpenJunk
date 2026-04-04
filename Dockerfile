# 使用Node.js 20作为基础镜像
FROM node:20-alpine AS base

# 安装必要的依赖
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制包管理文件和必要脚本
COPY package.json package-lock.json* ./
COPY scripts ./scripts/
COPY prisma ./prisma/

# 安装依赖并生成Prisma客户端 (会触发 postinstall -> switch-db.js -> prisma generate)
RUN npm ci

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 构建应用
RUN npm run build

# 生产阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物 (依赖于 next.config.ts 中的 output: 'standalone')
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# 创建上传目录
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 环境变量
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动命令 (使用 standalone 生成的 server.js)
CMD ["node", "server.js"]
