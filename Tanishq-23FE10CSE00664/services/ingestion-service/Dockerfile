FROM node:22-alpine

WORKDIR /app

COPY services/shared/package.json services/shared/
RUN cd services/shared && npm install --production

COPY services/ingestion-service/package.json services/ingestion-service/
RUN cd services/ingestion-service && npm install --production

COPY services/shared/ services/shared/
COPY services/ingestion-service/ services/ingestion-service/

WORKDIR /app/services/ingestion-service

RUN mkdir -p /app/uploads && chown node:node /app/uploads

USER node

CMD ["node", "src/worker.js"]
