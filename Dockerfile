FROM node:18.12.1-alpine

WORKDIR /opt/app
COPY . .
RUN npm install -g typescript
RUN npm install -g knex
RUN npm install
RUN tsc  index.ts

CMD ["./docker-entrypoint.sh"]
EXPOSE 8080