FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package.json ./backend/

# Install dependencies
WORKDIR /app/backend
RUN npm install --production

# Copy source code
WORKDIR /app
COPY backend ./backend
COPY frontend ./frontend

# Set environment variables
ENV PORT=9000
ENV NODE_ENV=production

# Expose the port
EXPOSE 9000

# Start the server
CMD ["node", "backend/server.js"]
