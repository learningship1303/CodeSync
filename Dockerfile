FROM node:20-alpine

RUN apk add --no-cache \
  python3 \
  g++ \
  gcc \
  make \
  default-jdk \
  bash

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
