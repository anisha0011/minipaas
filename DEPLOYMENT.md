# MiniPaaS Deployment Guide

Welcome to the MiniPaaS platform. This guide covers how to set up the infrastructure and run the application.

## Prerequisites

- **Docker & Docker Compose** installed on the host machine.
- **Node.js (v20+)** installed on the development machine.
- **GitHub Account** (with a Personal Access Token with `repo`, `workflow`, and `read:packages` scopes).
- **MongoDB** (You can use MongoDB Atlas for free or a local container).

## 1. Environment Configuration

Copy the example environment files and update them with your credentials.

### Backend (`apps/backend/.env`)
```bash
MONGODB_URI=your_mongodb_connection_string
GITHUB_TOKEN=your_personal_access_token
GITHUB_OWNER=your_github_username
MINIPAAS_WORKER_TOKEN=a_secure_random_string_for_internal_comms
```

## Simplified Startup Guide

To start the MiniPaaS platform, you must run the infrastructure layer (Docker) before the application code. Follow these steps in order:

### 1. Start Infrastructure (Docker)
The backend requires access to the Docker socket to manage containers on your host machine.
1. Open your terminal in the project root.
2. Run: 
   ```bash
   docker compose up -d
   ```
*This starts the database and exposes the necessary internal APIs.*

### 2. Start Backend API
The backend manages the logic and container orchestration.
1. Navigate to `apps/backend`.
2. Run:
   ```bash
   npm run dev
   ```

### 3. Start Frontend Dashboard
The frontend provides the user interface for monitoring and deploying.
1. Navigate to `apps/frontend`.
2. Run:
   ```bash
   npm run dev
   ```

**The application is now accessible via the URL provided by the frontend development server (typically `http://localhost:5173`).**

## 4. CI/CD Integration

To enable automated deployments:
1. Ensure your GitHub repository has a `.github/workflows/deploy.yml` file.
2. Register your application in the **Applications** dashboard via the UI.
3. The platform will automatically trigger deployments to your host machine when you push to the configured branch.

## 5. Troubleshooting

- **MongoDB Connection:** If you see `ECONNREFUSED` on Windows, ensure the MongoDB connection string is correctly configured and the host is reachable.
- **Docker Access:** If the backend cannot list containers, ensure the `docker.sock` is correctly mounted in `compose.yaml` and the user running the Node process has read/write permissions to it.
- **GitHub Auth:** If deployments remain queued, check the GitHub logs and verify the `GITHUB_TOKEN` permissions in your repository settings.