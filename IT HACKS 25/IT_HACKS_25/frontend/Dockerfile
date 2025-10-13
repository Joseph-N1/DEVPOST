FROM node:18-alpine

WORKDIR /app

# copy package files first to cache dependencies
COPY package.json package-lock.json* yarn.lock* /app/
RUN npm ci --silent || npm install --silent

# copy rest of app
COPY . /app

EXPOSE 3000

# dev command; docker-compose may override
CMD ["npm", "run", "dev"]
