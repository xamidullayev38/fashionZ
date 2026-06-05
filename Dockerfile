FROM node:20-alpine

WORKDIR /app

# Install deps separately for better layer caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY src ./src

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "src/server.js"]
...
