FROM node:20-alpine

WORKDIR /app

# Install dependencies first so Docker caches this layer between code changes.
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Uploads volume gets mounted here at runtime; pre-create it owned by the
# unprivileged user below so multer can write into it.
RUN mkdir -p uploads && chown -R node:node uploads

# Run as the unprivileged user that the base image already provides.
USER node

EXPOSE 5000

CMD ["node", "src/server.js"]
