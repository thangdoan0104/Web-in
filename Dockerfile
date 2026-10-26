FROM node:22-bookworm-slim AS base
# poppler-utils: pdfinfo, pdfimages, pdffonts, pdftoppm cho phần kiểm tra file PDF
RUN apt-get update && apt-get install -y --no-install-recommends poppler-utils openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS build
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build

FROM base AS run
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
