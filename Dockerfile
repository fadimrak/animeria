FROM node:20-slim

# Install curl (required by anime providers)
RUN apt-get update && apt-get install -y curl --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy rest of the project
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
