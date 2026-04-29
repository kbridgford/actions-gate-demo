# Use specific Node.js runtime with security updates
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy package files with correct ownership
COPY --chown=nodejs:nodejs package*.json ./

# Install dependencies securely
RUN npm ci --only=production && npm cache clean --force

# Copy source code with correct ownership
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

# Expose port 
EXPOSE 3000

# Health check for monitoring
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start application securely
CMD ["npm", "start"]