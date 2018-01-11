FROM node:alpine

# Create app directory
RUN mkdir -p /src
WORKDIR /src

# If you have native dependencies, you'll need extra tools
RUN apk add --no-cache make gcc g++ python
RUN npm install -g node-gyp

# Install app dependencies
COPY package.json /src/
COPY yarn.lock /src/
RUN yarn

# Bundle app source
COPY . /src/
RUN mkdir -p /root/cscop

# Enables customized options using environment variables
ENV PORT='8003'

# Run App
EXPOSE 8003
CMD ["yarn", "start"]
