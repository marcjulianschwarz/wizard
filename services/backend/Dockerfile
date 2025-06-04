FROM node:18-alpine

ARG FRONTEND_URL
ENV FRONTEND_URL=${FRONTEND_URL}

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
