FROM node:18-alpine

WORKDIR /app

# copy package files first to cache dependencies
COPY package.json package-lock.json* yarn.lock* /app/
RUN npm ci --silent || npm install --silent

# copy rest of app
COPY . /app

# Build with API URL from build args
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build next.js app
RUN npm run build

EXPOSE 3000

# Run in production
CMD ["npm", "run", "start"]
