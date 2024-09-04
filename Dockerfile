ARG NODE_VERSION=20.10.0

FROM node:${NODE_VERSION} as installer

WORKDIR /app

RUN apt update && apt install  --yes  \
    iptables  \
    iproute2  \
    wireguard-tools

COPY package*.json .
COPY yarn.lock .

RUN yarn

FROM node:${NODE_VERSION}

WORKDIR /app

COPY --from=installer /app /app
COPY . ./backend

WORKDIR ./backend

RUN yarn build

EXPOSE 3232
EXPOSE 8181
CMD ["yarn", "server"]
