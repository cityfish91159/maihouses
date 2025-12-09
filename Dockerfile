# Hermetic Build - 固定 Node 版本
FROM node:20-alpine

WORKDIR /app

# 複製 lockfile 先安裝依賴
COPY package*.json ./
COPY pnpm-lock.yaml* ./
COPY yarn.lock* ./

# 使用 frozen lockfile 安裝
RUN npm ci --frozen-lockfile || pnpm install --frozen-lockfile || yarn install --frozen-lockfile

# 複製原始碼
COPY . .

# 建置
RUN npm run build

# 執行
CMD ["npm", "start"]
