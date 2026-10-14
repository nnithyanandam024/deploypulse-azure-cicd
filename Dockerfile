# ==========================================
# DeployPulse Production Dockerfile
# Lean, unprivileged Node.js 22 Alpine image
# ==========================================
FROM node:22-alpine

# Set non-interactive production environment
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

WORKDIR /app

# Copy dependency definition
COPY package.json ./

# Copy application source code
COPY src/ ./src/

# Security best practice: switch to built-in unprivileged user
USER node

# Expose internal Node.js port (routed via Nginx reverse proxy)
EXPOSE 3000

# Container healthcheck for local container monitoring
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

# Start application server
CMD ["node", "src/server.js"]
