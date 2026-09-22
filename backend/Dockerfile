FROM node:20-alpine

WORKDIR /app

# Install dependencies first so Docker caches this layer between code changes.
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Run as the unprivileged user that the base image already provides.
USER node

EXPOSE 5000

CMD ["node", "src/server.js"]
