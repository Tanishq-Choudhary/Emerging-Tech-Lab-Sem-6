FROM node:22-alpine

WORKDIR /app

# Copy root configurations
COPY package.json ./

# Copy packages
COPY services/shared/ package.json services/shared/
COPY services/ingestion-service/ package.json services/ingestion-service/

# Install from root leveraging workspaces
RUN npm install --production

# Copy source
COPY services/shared/ services/shared/
COPY services/ingestion-service/ services/ingestion-service/

WORKDIR /app/services/ingestion-service

RUN mkdir -p /app/uploads && chown node:node /app/uploads

USER node

CMD ["node", "src/worker.js"]
