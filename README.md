# voting-app

Voting system with two separate microservices for managing votes and displaying results.

## Requirements

- [docker](https://docs.docker.com/engine/install/)
- [docker compose](https://docs.docker.com/compose/install/)
- [nvm](https://github.com/nvm-sh/nvm)

## Quick Start with Docker

```bash
# Download public images
docker compose pull

# Build code
docker compose build

# Start services
docker compose up -d

# Check service health
docker compose ps

# View logs for specific service
docker compose logs -f vote

# Stop and remove volumes (deletes data)
docker compose down -v
```

## Testing Health Checks

```bash
# Test vote service health
curl http://localhost:3001/healthz

# Test results service health
curl http://localhost:3002/healthz

# Expected response when healthy:
# {"status":"healthy","service":"vote","database":"connected"}

# Expected response when unhealthy:
# {"status":"unhealthy","service":"vote","database":"disconnected"}
```
