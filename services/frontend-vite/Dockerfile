FROM node:20-alpine

ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build
EXPOSE 3000

# Install a simple HTTP server to serve the static files
RUN npm install -g serve

# Serve the built files from the dist directory
CMD ["serve", "-s", "dist", "-l", "3000"]
