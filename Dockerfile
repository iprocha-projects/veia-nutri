FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies needed for node-gyp / native modules if any
RUN apk add --no-cache libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache openssl

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src

# Create upload directories
RUN mkdir -p /app/public/uploads/meals /app/public/uploads/progress

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node --import tsx/esm prisma/seed.ts || npx tsx prisma/seed.ts || node prisma/seed.js; npm start"]
