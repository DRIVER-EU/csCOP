FROM node:alpine

# Create app directory
RUN mkdir -p /src
WORKDIR /src

# If you have native dependencies, you'll need extra tools
RUN apk add --no-cache make gcc g++ python git
RUN npm install -g node-gyp typescript bower

# Install app dependencies
COPY package.json /src/
COPY yarn.lock /src/
RUN yarn

# Bundle app source
COPY . /src/
RUN mkdir -p /root/cscop

# Enables customized options using environment variables
ENV CSCOP_PORT='8003'

# Run App
EXPOSE 8003

RUN yarn install --production
WORKDIR /src/public
RUN bower i --allow-root
WORKDIR /src
RUN tsc

CMD ["yarn", "start"]
