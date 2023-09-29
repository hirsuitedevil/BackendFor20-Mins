FROM node:alpine

WORKDIR /tmins

COPY ./package.json ./
RUN yarn install

COPY . .

CMD ["yarn", "dev"]