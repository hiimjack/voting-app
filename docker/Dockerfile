ARG NODE_VERSION=24.12

FROM node:${NODE_VERSION} AS dependencies

ENV NODE_ENV=production
ENV DEBIAN_FRONTEND=noninteractive
ARG SERVICE_NAME

WORKDIR /app

COPY ./src/${SERVICE_NAME}/package*.json .
RUN npm install --omit=dev


FROM node:${NODE_VERSION}-slim AS final

ENV NODE_ENV=production
ENV DEBIAN_FRONTEND=noninteractive
ARG SERVICE_NAME

WORKDIR /app

COPY --from=dependencies /app/node_modules/ ./node_modules

COPY ./src/${SERVICE_NAME}/ .

CMD [ "npm", "run", "start"]
