ARG NODE_VERSION=20.10.0

FROM node:${NODE_VERSION} AS installer

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json .
COPY yarn.lock .

RUN yarn

FROM node:${NODE_VERSION}

RUN apt update && apt install  --yes  \
    iptables  \
    iproute2  \
    wireguard-tools

WORKDIR /app
ENV NODE_ENV=production

COPY --from=installer /app /app
COPY . .

RUN yarn build

EXPOSE 3232
EXPOSE 8181
CMD ["yarn", "server"]
