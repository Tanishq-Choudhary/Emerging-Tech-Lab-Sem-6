FROM node:22-alpine

WORKDIR /app

# Install shared dependencies
COPY services/shared/package.json /app/services/shared/package.json
RUN cd /app/services/shared && npm install --production

# Copy shared source
COPY services/shared/src /app/services/shared/src

# Install gateway dependencies
COPY services/api-gateway/package.json /app/services/api-gateway/package.json
RUN cd /app/services/api-gateway && npm install --production

# Copy ALL gateway source — including subfolders
COPY services/api-gateway/src /app/services/api-gateway/src

# Link shared as a local module
RUN ln -s /app/services/shared /app/services/api-gateway/node_modules/codeatlas-shared

WORKDIR /app/services/api-gateway
EXPOSE 3000
USER node
CMD ["node", "src/server.js"]