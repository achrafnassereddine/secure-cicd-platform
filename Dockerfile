FROM node:24.6.0-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json ./
RUN npm install --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:24.6.0-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/src/server.js"]
