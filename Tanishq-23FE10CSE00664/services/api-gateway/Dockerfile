FROM node:22-alpine

WORKDIR /app

COPY services/shared/package.json services/shared/
RUN cd services/shared && npm install --production

COPY services/api-gateway/package.json services/api-gateway/
RUN cd services/api-gateway && npm install --production

COPY services/shared/ services/shared/
COPY services/api-gateway/ services/api-gateway/

WORKDIR /app/services/api-gateway

EXPOSE 3000

USER node

CMD ["node", "src/server.js"]
