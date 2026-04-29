# Use official Node.js runtime - VULNERABILITY: Using potentially outdated base image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# SECURITY-ISSUE: Installing packages as root
# VULNERABILITY: Not using specific package versions
RUN npm ci --only=production

# Copy source code
COPY . .

# CRITICAL-VULNERABILITY: Running as root user (container security risk)
# Create a non-root user
# USER node

# VULNERABILITY: Exposing internal port without security considerations
EXPOSE 3000

# SECURITY-ISSUE: Health check might expose internal information
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# VULNERABILITY: No security hardening applied to container
# Start application
CMD ["npm", "start"]