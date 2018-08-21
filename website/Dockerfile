FROM rinzeb/node-python-typescript-git
# Create app directory
RUN mkdir -p /src
WORKDIR /src

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

WORKDIR /src/public
RUN bower i --allow-root --force
WORKDIR /src
RUN tsc

RUN ["chmod", "+x", "./scripts/wait-for.sh"]

CMD ["yarn", "start"]
