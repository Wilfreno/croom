FROM node:18-alpine


WORKDIR /app

RUN npm install -g pnpm

COPY package*.json pnpm-lock.yaml ./

RUN pnpm install 

COPY . /app

ENV PORT=8000

EXPOSE 8000

CMD ["sh", "-c", "npx prisma generate && pnpm production_server"]
