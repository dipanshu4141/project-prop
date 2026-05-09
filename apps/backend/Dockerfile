FROM node:22-alpine

RUN apk add --no-cache git python3 make g++

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy" npx prisma generate --schema=prisma/schema.prisma
RUN npm run build
RUN ls -la dist/

EXPOSE 3000

CMD ["node", "dist/src/main.js"]