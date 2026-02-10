FROM node:20-bookworm

WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Ensure entrypoint is executable
RUN chmod +x scripts/docker-entrypoint.sh

EXPOSE 5173

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
