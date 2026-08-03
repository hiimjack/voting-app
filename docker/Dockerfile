ARG NODE_VERSION=24.13

FROM node:${NODE_VERSION} AS dependencies

ENV NODE_ENV=production
ENV DEBIAN_FRONTEND=noninteractive
ARG SERVICE_NAME

WORKDIR /app

COPY ./src/${SERVICE_NAME}/package*.json .

RUN npm config set fund false && \
    npm config set update-notifier false && \
    npm ci --omit=dev && \
    npm cache clean --force

COPY ./src/${SERVICE_NAME}/ .



FROM node:${NODE_VERSION}-slim AS final

ENV NODE_ENV=production
ENV DEBIAN_FRONTEND=noninteractive
ARG SERVICE_NAME

WORKDIR /app

COPY --from=dependencies --chown=node:node /app/ .

USER node

EXPOSE 3000

CMD [ "npm", "run", "start"]
