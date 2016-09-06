FROM node:6
MAINTAINER Laurent Renard <laurent34azerty@gmail.com>
COPY . /app
WORKDIR /app
RUN npm install --production
EXPOSE 3000
CMD ["npm", "start"]