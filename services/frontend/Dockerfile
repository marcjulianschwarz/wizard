FROM node:18-alpine

ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
