FROM node:24.15-alpine AS build

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY nest-cli.json tsconfig*.json ./
COPY src ./src

RUN npm run build
RUN npm prune --omit=dev

FROM node:24.15-alpine AS production

ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app

RUN apk add --no-cache openssl

COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/prisma ./prisma

USER node

EXPOSE 3001

CMD ["node", "dist/main.js"]
