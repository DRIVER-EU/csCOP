FROM rinzeb/node-python-typescript-git AS builder
RUN mkdir -p /src
WORKDIR /src
COPY . /src/
RUN yarn
WORKDIR /src/public
RUN bower i --allow-root --force
WORKDIR /src
RUN tsc

FROM node:alpine
RUN mkdir -p /src
COPY --from=builder /src /src
WORKDIR /src
ENV CSCOP_PORT='8003'
EXPOSE 8003
RUN ["chmod", "+x", "./scripts/wait-for.sh"]
CMD ["yarn", "start"]
