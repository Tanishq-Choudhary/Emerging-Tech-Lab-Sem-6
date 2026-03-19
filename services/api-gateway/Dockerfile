FROM node:22-alpine

WORKDIR /app

# Copy root configurations
COPY package.json ./

# Copy packages
COPY services/shared/ package.json services/shared/
COPY services/api-gateway/ package.json services/api-gateway/

# Install from root leveraging workspaces
RUN npm install --production

# Copy source
COPY services/shared/ services/shared/
COPY services/api-gateway/ services/api-gateway/

WORKDIR /app/services/api-gateway
EXPOSE 3000

USER node

CMD ["node", "src/server.js"]

