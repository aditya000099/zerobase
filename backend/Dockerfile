FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN rm -rf node_modules && npm install
COPY . .
EXPOSE 8080
CMD ["node", "index.js"]