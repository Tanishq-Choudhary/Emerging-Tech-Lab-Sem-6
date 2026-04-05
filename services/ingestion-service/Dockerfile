FROM node:22-alpine

WORKDIR /app

# Install shared dependencies
COPY services/shared/package.json /app/services/shared/package.json
RUN cd /app/services/shared && npm install --production

# Copy shared source
COPY services/shared/src /app/services/shared/src

# Install ingestion dependencies
COPY services/ingestion-service/package.json /app/services/ingestion-service/package.json
RUN cd /app/services/ingestion-service && npm install --production

# Copy ALL ingestion source — including subfolders
COPY services/ingestion-service/src /app/services/ingestion-service/src

# Link shared as a local module
RUN ln -s /app/services/shared /app/services/ingestion-service/node_modules/codeatlas-shared

RUN mkdir -p /app/uploads && chown node:node /app/uploads

WORKDIR /app/services/ingestion-service
USER node
CMD ["node", "src/worker.js"]