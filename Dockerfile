ARG NODE_VERSION=20.10.0

FROM node:${NODE_VERSION}

RUN apt update && apt install  --yes  \
    iptables  \
    iproute2  \
    wireguard-tools

WORKDIR .
COPY . ./backend

WORKDIR ./backend

RUN yarn
RUN yarn build

EXPOSE 3232
EXPOSE 8181
CMD ["yarn", "server"]
