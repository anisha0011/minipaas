# MiniPaaS - Self-Hosted Platform as a Service

> A lightweight, self-hosted PaaS (Platform-as-a-Service) that lets you **register, build, deploy, monitor, and rollback** containerized applications — all from a single web dashboard.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [System Architecture](#system-architecture)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Data Models](#data-models)
7. [API Reference](#api-reference)
8. [How It Works — Step by Step](#how-it-works--step-by-step)
9. [CI/CD Pipeline (GitHub Actions)](#cicd-pipeline-github-actions)
10. [Deployment Lifecycle](#deployment-lifecycle)
11. [Monitoring System](#monitoring-system)
12. [Rollback System](#rollback-system)
13. [Security](#security)
14. [Environment Variables](#environment-variables)
15. [Getting Started (Local Setup)](#getting-started-local-setup)
16. [Running with Docker Compose](#running-with-docker-compose)
17. [Integration Tests](#integration-tests)
18. [Troubleshooting](#troubleshooting)

---

## Overview

**MiniPaaS** is a full-stack mini platform-as-a-service application designed to simulate how production PaaS providers (like Heroku, Render, or Railway) work — but completely self-hosted on your own machine or server.

When a developer registers a GitHub repository, MiniPaaS:
1. Creates an application record in the database
2. On deployment trigger, calls the **GitHub Actions API** to dispatch a self-hosted workflow
3. The GitHub Actions runner (running locally) **clones the repo**, **builds a Docker image**, and **runs the container**
4. The backend continuously **monitors** all running containers (CPU, memory, uptime, status)
5. If something goes wrong, the user can **one-click rollback** to any previous successful deployment

---

## Features

| Feature | Description |
|---|---|
| **Application Registry** | Register any GitHub repository with a name, slug, branch, and description |
| **One-Click Deploy** | Trigger a full CI/CD pipeline with a single API/UI action |
| **Docker-Based Builds** | Every deployment builds a Docker image and runs a container |
| **Live Monitoring** | Polls every 30 seconds for container CPU, memory, uptime, and status |
| **Instant Rollback** | Roll back to any previous successful deployment by reusing its Docker image |
| **Deployment Logs** | Structured, timestamped log entries per deployment (info, warn, error) |
| **Image Cleanup** | Automatically deletes Docker images beyond the 5 most recent deployments |
| **Worker Auth** | Internal CI/CD callbacks are protected by a shared bearer token |
| **Dashboard UI** | Full React dashboard with stats, application cards, deployment history, and log viewer |

---

## System Architecture

```
+----------------------------------------------------------+
|                      USER BROWSER                        |
|              React + Vite Frontend (port 3000)           |
+-------------------------+--------------------------------+
                          | REST API calls
                          v
+----------------------------------------------------------+
|               MINIPAAS BACKEND (port 5000)               |
|   Express.js + TypeScript + MongoDB (Mongoose)           |
|                                                          |
|  +--------------+  +----------------+  +--------------+  |
|  | App          |  | Monitoring     |  | Internal     |  |
|  | Controller   |  | Service        |  | Routes       |  |
|  | (CRUD +      |  | (30s poll)     |  | (Worker API) |  |
|  | Deploy)      |  |                |  |              |  |
|  +------+-------+  +-------+--------+  +------+-------+  |
|         |                  |                  |          |
|         v                  v                  v          |
|  +----------------------------------------------------+  |
|  |         MongoDB Atlas (Cloud Database)             |  |
|  |  Applications | Deployments | Logs | HealthChecks  |  |
|  +----------------------------------------------------+  |
+-------------------------+--------------------------------+
                          | GitHub API (workflow_dispatch)
                          v
+----------------------------------------------------------+
|            GITHUB ACTIONS SELF-HOSTED RUNNER             |
|       (runs on the same machine as MiniPaaS)             |
|                                                          |
|  Step 1. Clone repository from GitHub                    |
|  Step 2. docker build -t minipaas-<appId>:<deployId> .  |
|  Step 3. docker run -d --name app-<appId> -p 8080:80    |
|  Step 4. PATCH /api/internal/deployments/:id/status     |
+----------------------------------------------------------+
```

---

## Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| **Node.js + TypeScript** | Server runtime and type safety |
| **Express.js v5** | REST API framework |
| **Mongoose + MongoDB Atlas** | ODM and persistent data store |
| **Axios** | HTTP client for GitHub API calls |
| **Docker CLI** | Container management via `child_process` shell commands |

### Frontend

| Technology | Purpose |
|---|---|
| **React 19 + TypeScript** | UI framework |
| **Vite** | Fast development build tool |
| **React Router v7** | Client-side routing |
| **Tailwind CSS v4** | Utility-first styling |
| **Lucide React** | Icon library |
| **Axios** | API communication |

### Infrastructure and CI/CD

| Technology | Purpose |
|---|---|
| **Docker + Docker Compose** | Containerization of backend and frontend |
| **GitHub Actions** | CI/CD pipeline automation |
| **Self-Hosted GitHub Runner** | Executes build/deploy steps on local machine |
| **Nginx** | Serves the frontend production build in Docker |

---

## Project Structure

```
minipaas/
+-- .github/
|   +-- workflows/
|       +-- deploy.yml          # Main CI/CD pipeline (triggered by backend)
|       +-- runner-test.yml     # Test workflow for runner connectivity
|
+-- apps/
|   +-- backend/                # Node.js Express API
|   |   +-- src/
|   |   |   +-- config/         # Database connection config
|   |   |   +-- controllers/
|   |   |   |   +-- ApplicationController.ts   # CRUD + deployment triggers
|   |   |   +-- middleware/
|   |   |   |   +-- auth.ts     # Worker token verification middleware
|   |   |   +-- models/
|   |   |   |   +-- Application.ts     # App schema (name, slug, branch, repo URL)
|   |   |   |   +-- Deployment.ts      # Deployment schema (status, imageTag, etc.)
|   |   |   |   +-- DeploymentLog.ts   # Structured log entries per deployment
|   |   |   |   +-- HealthCheck.ts     # Container health snapshots (every 30s)
|   |   |   +-- routes/
|   |   |   |   +-- applicationRoutes.ts   # /api/applications
|   |   |   |   +-- deploymentRoutes.ts    # /api/deployments
|   |   |   |   +-- internalRoutes.ts      # /api/internal (worker callbacks)
|   |   |   |   +-- monitoringRoutes.ts    # /api/monitoring
|   |   |   +-- services/
|   |   |   |   +-- dockerService.ts       # Docker CLI wrapper (inspect/stats/run/stop)
|   |   |   |   +-- githubService.ts       # GitHub API: workflow_dispatch trigger
|   |   |   |   +-- monitoringService.ts   # 30-second background polling loop
|   |   |   |   +-- rollbackService.ts     # Rollback to a previous Docker image
|   |   |   |   +-- cleanupService.ts      # Prune old Docker images (keep 5)
|   |   |   +-- server.ts                  # Entry point: Express app setup
|   |   +-- Dockerfile
|   |   +-- package.json
|   |   +-- tsconfig.json
|   |
|   +-- frontend/               # React + Vite Single Page Application
|       +-- src/
|       |   +-- components/
|       |   |   +-- Layout.tsx      # App shell wrapper
|       |   |   +-- Sidebar.tsx     # Navigation sidebar with route links
|       |   +-- pages/
|       |   |   +-- Overview.tsx           # Dashboard stats + infra status
|       |   |   +-- Applications.tsx       # Application list + create modal
|       |   |   +-- ApplicationDetail.tsx  # Deploy button + detail view
|       |   |   +-- deployments/
|       |   |   |   +-- Deployments.tsx
|       |   |   |   +-- DeploymentDetail.tsx
|       |   |   +-- logs/
|       |   |       +-- Logs.tsx
|       |   +-- services/
|       |   |   +-- api.ts          # Axios instance with backend base URL
|       |   +-- App.tsx             # Route definitions
|       +-- Dockerfile
|       +-- nginx.conf
|       +-- package.json
|
+-- infra/
|   +-- nginx/
|       +-- default.conf        # Nginx reverse-proxy config
|
+-- scripts/
|   +-- integration-test.ts    # End-to-end API test suite
|
+-- compose.yaml                # Docker Compose: backend + frontend services
+-- DEPLOYMENT.md               # Deployment quick-guide
+-- .env.example                # Root-level environment variable template
```

---

## Data Models

### `Application`

Represents a registered service/repository.

| Field | Type | Description |
|---|---|---|
| `name` | String | Display name of the service |
| `slug` | String (unique) | URL-safe identifier for the app |
| `description` | String | Optional human-readable description |
| `repositoryUrl` | String | Full GitHub repository URL |
| `branch` | String | Branch to build from (default: `main`) |
| `status` | Enum | `active` or `inactive` |
| `createdAt` | Date | Auto-managed by Mongoose timestamps |

### `Deployment`

Represents one deployment attempt for an application.

| Field | Type | Description |
|---|---|---|
| `applicationId` | ObjectId | Reference to parent Application |
| `status` | Enum | `queued / building / deploying / success / failed / cancelled` |
| `commitSha` | String | Git commit SHA being deployed |
| `imageTag` | String | Docker image tag built for this deployment |
| `containerName` | String | Docker container name (e.g., `app-<appId>`) |
| `containerPort` | Number | Host port mapped to the container |
| `startedAt` | Date | When the CI build began |
| `finishedAt` | Date | When deployment completed or failed |
| `errorMessage` | String | Error detail if deployment failed |
| `isRollback` | Boolean | Whether this is a rollback deployment |
| `rolledBackFrom` | ObjectId | Source deployment reference for rollbacks |

### `DeploymentLog`

Structured log entries linked to a deployment.

| Field | Type | Description |
|---|---|---|
| `deploymentId` | ObjectId | Parent deployment reference |
| `level` | Enum | `info`, `warn`, or `error` |
| `message` | String | Log message content |
| `timestamp` | Date | Auto-set on creation |

### `HealthCheck`

A health snapshot taken every 30 seconds per active application.

| Field | Type | Description |
|---|---|---|
| `applicationId` | ObjectId | Parent application reference |
| `deploymentId` | ObjectId | Associated deployment |
| `containerName` | String | Docker container name |
| `status` | Enum | `running`, `exited`, `restarting`, `unknown` |
| `healthStatus` | Enum | `healthy`, `unhealthy`, `unknown` |
| `cpuUsage` | Number | CPU percentage from `docker stats` |
| `memoryUsage` | Number | Memory used in bytes |
| `memoryLimit` | Number | Memory limit in bytes |
| `uptime` | Number | Container uptime in seconds |
| `checkedAt` | Date | Timestamp of the health poll |

---

## API Reference

### Applications — `/api/applications`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/applications` | List all registered applications |
| `POST` | `/api/applications` | Create and register a new application |
| `GET` | `/api/applications/:id` | Get a single application by MongoDB ID |
| `PATCH` | `/api/applications/:id` | Update application metadata |
| `DELETE` | `/api/applications/:id` | Delete app (blocked if deployments exist — 409) |
| `GET` | `/api/applications/stats` | Platform-wide statistics (counts) |
| `POST` | `/api/applications/:id/deployments` | **Trigger a new deployment** |

### Deployments — `/api/deployments`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/deployments` | List deployments (filter by `applicationId`, `status`) |
| `GET` | `/api/deployments/:id` | Get a single deployment record |
| `GET` | `/api/deployments/:id/logs` | Get ordered log entries for a deployment |

### Monitoring — `/api/monitoring`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/monitoring/applications/:id/health` | Latest health snapshot for an app |
| `GET` | `/api/monitoring/applications/:id/health/history` | Last 50 health checks (sorted newest first) |

### Internal (Worker) — `/api/internal`

> All internal routes require: `Authorization: Bearer <MINIPAAS_WORKER_TOKEN>`

| Method | Endpoint | Description |
|---|---|---|
| `PATCH` | `/api/internal/deployments/:id/status` | CI runner reports deployment status updates |
| `POST` | `/api/internal/deployments/:id/logs` | CI runner posts structured log messages |
| `POST` | `/api/internal/applications/:appId/rollback/:deploymentId` | Trigger a rollback to previous deployment |
| `DELETE` | `/api/internal/test/cleanup/:appId` | Test cleanup endpoint (integration tests only) |

### Health Checks — `/health`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Liveness check — returns service name and timestamp |
| `GET` | `/health/ready` | Readiness check — verifies MongoDB connection state |

---

## How It Works — Step by Step

### Phase 1 — Register an Application

```
User fills in the registration form in the React UI
           |
           v
POST /api/applications
Body: { name, slug, repositoryUrl, branch, description }
           |
           v
ApplicationController creates and saves an Application document to MongoDB
           |
           v
New application card appears on the Applications dashboard
```

---

### Phase 2 — Trigger a Deployment

```
User clicks "Deploy" on the Application Detail page
           |
           v
POST /api/applications/:id/deployments
           |
           +-- 1. New Deployment record saved in MongoDB
           |       status = "queued"
           |
           +-- 2. githubService.triggerDeploymentWorkflow() called
           |       POST https://api.github.com/repos/owner/repo/
           |            actions/workflows/deploy.yml/dispatches
           |       inputs: { deploymentId, applicationId, repositoryUrl, branch }
           |
           v
GitHub Actions workflow is triggered on the self-hosted runner
```

---

### Phase 3 — GitHub Actions Runner Executes

```
deploy.yml starts on the self-hosted runner (labeled: minipaas)
           |
           +-- Step 1: Debug environment (connectivity check to localhost:5000)
           |
           +-- Step 2: Report status = "building"
           |    PATCH /api/internal/deployments/:deploymentId/status
           |    { status: "building" }   -> startedAt is saved in MongoDB
           |
           +-- Step 3: Clone the source code
           |    git clone -b <branch> <repositoryUrl> deployment_source
           |
           +-- Step 4: Build the Docker image
           |    docker build -t minipaas-<appId>:<deployId> ./deployment_source
           |
           +-- Step 5: Stop existing container (if any), start new one
           |    docker stop app-<appId>   (if exists)
           |    docker rm   app-<appId>   (if exists)
           |    docker run -d --name app-<appId> -p 8080:80 minipaas-<appId>:<deployId>
           |
           +-- Step 6: Report status = "success"
                PATCH /api/internal/deployments/:deploymentId/status
                { status: "success", imageTag: "<deploymentId>" }  -> finishedAt saved
```

---

### Phase 4 — Continuous Monitoring (Background Loop)

```
Backend server starts
           |
           v
startMonitoring() called -> setInterval every 30,000ms (30 seconds)
           |
           v
runMonitoringCycle() executes:
    For each Application with status = "active":
           |
           +-- 1. Find the latest Deployment record -> get containerName
           |
           +-- 2. docker inspect container -> status, startedAt, imageTag
           |
           +-- 3. docker stats --no-stream -> CPU%, memoryUsage, memoryLimit
           |
           +-- 4. Save a new HealthCheck document to MongoDB
           |       { status, healthStatus, cpuUsage, memoryUsage, uptime }
           |
           +-- 5. If container status = "exited" AND last deployment was "success":
                   Save an error-level DeploymentLog: "Container exited unexpectedly"
```

---

### Phase 5 — Rollback to Previous Deployment

```
User selects a previous successful deployment and clicks "Rollback"
           |
           v
POST /api/internal/applications/:appId/rollback/:deploymentId
           |
           +-- 1. Find target Deployment by ID -> must be status="success" with imageTag
           |
           +-- 2. Verify Docker image still exists locally
           |       docker inspect --type=image <imageTag>
           |
           +-- 3. Stop the currently running container
           |       docker stop app-<appId>
           |
           +-- 4. Create a new Deployment record in MongoDB
           |       { isRollback: true, rolledBackFrom: <targetDeploymentId> }
           |
           +-- 5. Start the old Docker image as a new container
           |       docker run -d --name app-<appId> <previousImageTag>
           |
           +-- 6. Mark the new rollback Deployment as status="success"
           |
           +-- 7. Run cleanupOldImages() to remove images older than 5 deployments
           |
           v
Rollback complete. Old version is live again with full audit trail in DB.
```

---

## CI/CD Pipeline (GitHub Actions)

The pipeline is defined in `.github/workflows/deploy.yml`.

It is triggered **only via `workflow_dispatch`** (never on push), meaning **all deployments are initiated by the MiniPaaS backend** through the GitHub API. This gives the platform full control over when and what gets deployed.

### Workflow Inputs

| Input | Description |
|---|---|
| `deploymentId` | The MongoDB `_id` of the Deployment document |
| `applicationId` | The MongoDB `_id` of the Application |
| `repositoryUrl` | The Git repository URL to clone |
| `branch` | The branch to build |

### Runner Labels

```yaml
runs-on: [self-hosted, Windows, X64, minipaas]
```

The runner must be registered on the host machine with the `minipaas` label for the workflow to pick it up.

### Required GitHub Repository Secrets

| Secret Name | Description |
|---|---|
| `BACKEND_URL` | Full URL of the MiniPaaS backend (e.g., `http://localhost:5000`) |
| `MINIPAAS_WORKER_TOKEN` | Shared bearer token matching `MINIPAAS_WORKER_TOKEN` in backend `.env` |

---

## Deployment Lifecycle

Every deployment transitions through these statuses:

```
QUEUED ──> BUILDING ──> DEPLOYING ──> SUCCESS
              |                          |
              +──────────────────────> FAILED
                                         |
                                     CANCELLED
```

| Status | Who Sets It | What It Means |
|---|---|---|
| `queued` | Backend API (on creation) | Deployment created, waiting for GitHub runner to start |
| `building` | GitHub Actions runner | Source code being cloned and Docker image being built |
| `deploying` | GitHub Actions runner | Container is being started on the host |
| `success` | GitHub Actions runner | Container is live and running successfully |
| `failed` | GitHub Actions runner | One of the CI/CD steps threw an error |
| `cancelled` | Manual action | Deployment was manually cancelled |

---

## Monitoring System

The monitoring service runs as a **background process** inside the backend:

- **Start**: Called automatically when the Express server starts
- **Stop**: Called gracefully on `SIGTERM` / `SIGINT` (Docker stop, Ctrl+C)
- **Interval**: Every **30 seconds**
- **Scope**: Only applications with `status = "active"` are checked
- **Per application**:
  - Looks up the **latest deployment** to get the `containerName`
  - Runs `docker inspect` to get: container status, start time, image tag
  - Runs `docker stats --no-stream` to get: CPU%, memory used, memory limit
  - Saves a `HealthCheck` document to MongoDB
- **Alert detection**: If a container `status = "exited"` but the last deployment `status = "success"`, an `error`-level `DeploymentLog` entry is automatically created

---

## Rollback System

MiniPaaS retains Docker images to enable instant rollback:

- **Image retention policy**: The last **5 successful** deployment images are kept
- **Cleanup trigger**: `cleanupOldImages()` runs automatically after every rollback
- **Rollback eligibility**: Only deployments with `status = "success"` AND a non-null `imageTag` can be used as rollback targets
- **Audit trail**: Every rollback creates a **new Deployment document** with `isRollback: true` and `rolledBackFrom` pointing to the source deployment — ensuring full history is preserved

---

## Security

### Worker Token Authentication

All routes under `/api/internal/*` are protected by the `verifyWorkerToken` middleware:

```
Request must include:
Authorization: Bearer <MINIPAAS_WORKER_TOKEN>
```

- Token is set via the `MINIPAAS_WORKER_TOKEN` environment variable on the backend
- The same value must be stored in GitHub repository secrets as `MINIPAAS_WORKER_TOKEN`
- Missing header → `401 Unauthorized`
- Wrong token → `403 Forbidden`

---

## Environment Variables

### Backend — `apps/backend/.env`

```env
# MongoDB connection string (Atlas or local)
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/minipaas

# Express server port
PORT=5000

# GitHub Personal Access Token (required scopes: repo, workflow)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# GitHub account and repo where deploy.yml lives
GITHUB_OWNER=your-github-username
GITHUB_REPO=minipaas

# Shared secret between backend and GitHub Actions runner
MINIPAAS_WORKER_TOKEN=a_long_random_secure_string
```

### Frontend — Build Argument

```env
# URL of the MiniPaaS backend API (injected at Vite build time)
VITE_API_URL=http://localhost:5000
```

---

## Getting Started (Local Setup)

### Prerequisites

- Node.js v20 or higher
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Git
- A MongoDB Atlas account (free tier is sufficient)
- A GitHub Personal Access Token with `repo` and `workflow` scopes

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/anisha0011/minipaas.git
cd minipaas
```

### Step 2 — Configure Environment Variables

```bash
# Copy the backend env template
cp apps/backend/.env.example apps/backend/.env
```

Open `apps/backend/.env` and fill in:
- `MONGODB_URI` — your MongoDB Atlas connection string
- `GITHUB_TOKEN` — your GitHub Personal Access Token
- `GITHUB_OWNER` — your GitHub username
- `GITHUB_REPO` — the repo name where `deploy.yml` lives
- `MINIPAAS_WORKER_TOKEN` — any strong random string (must match GitHub secret)

### Step 3 — Install Dependencies

```bash
# Install backend dependencies
cd apps/backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Step 4 — Register a Self-Hosted GitHub Actions Runner

1. Go to your GitHub repository → **Settings** → **Actions** → **Runners**
2. Click **"New self-hosted runner"**
3. Select your operating system and follow the on-screen instructions
4. When asked for labels, add the label: **`minipaas`**
5. Start the runner — it will now listen for deployment workflow dispatches

### Step 5 — Add GitHub Repository Secrets

Go to GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret Name | Value |
|---|---|
| `BACKEND_URL` | `http://localhost:5000` |
| `MINIPAAS_WORKER_TOKEN` | Same value as set in `apps/backend/.env` |

### Step 6 — Start the Services

**Terminal 1 — Backend API:**
```bash
cd apps/backend
npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2 — Frontend Dashboard:**
```bash
cd apps/frontend
npm run dev
# Dashboard opens on http://localhost:5173
```

### Step 7 — Deploy Your First App

1. Open `http://localhost:5173` in your browser
2. Go to **Applications** → click **"Register Application"**
3. Fill in: Name, Slug, Branch, and GitHub Repository URL
4. Open the application → click **"Deploy"**
5. Watch the deployment status update in the dashboard

---

## Running with Docker Compose

To run both services as production Docker containers:

```bash
# From the project root
docker compose up -d
```

| Service | Port | Description |
|---|---|---|
| Backend | `5000` | Express API with MongoDB connection |
| Frontend | `3000` | React app served via Nginx |

> **Important**: The backend container mounts `/var/run/docker.sock` (Docker socket) into the container. This allows the backend to run Docker commands on the host machine from inside the container.

To stop all services:
```bash
docker compose down
```

---

## Integration Tests

An automated end-to-end test suite is located at `scripts/integration-test.ts`.

The tests cover the full API lifecycle:

1. Create an Application
2. Retrieve Application by ID
3. Verify Application appears in the list
4. Update Application metadata via PATCH
5. Create a Deployment record
6. Write and retrieve Deployment Logs (verifying order)
7. Validate error handling (invalid ObjectIds, missing resources)
8. Confirm deletion is blocked when deployments exist (409 Conflict)
9. Cleanup all test records via the internal cleanup endpoint

**How to run** (requires backend running on port 5000):

```bash
cd scripts
npx tsx integration-test.ts
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| **MongoDB ECONNREFUSED** | Check `MONGODB_URI` in `.env`. Ensure your IP is allowlisted in MongoDB Atlas (use `0.0.0.0/0` for dev). |
| **Deployment stays as queued** | Verify the GitHub Actions self-hosted runner is online with the `minipaas` label. Check `GITHUB_TOKEN` has the `workflow` permission scope. |
| **Docker access denied** | On Linux: `sudo usermod -aG docker $USER` then restart. On Windows: ensure Docker Desktop is running. |
| **GitHub token errors (401/403)** | Regenerate your PAT and ensure it has `repo` and `workflow` scopes selected. |
| **403 Forbidden on internal routes** | The token in the GitHub workflow secret does not match `MINIPAAS_WORKER_TOKEN` in backend `.env`. Make sure they are identical. |
| **Frontend shows blank or API errors** | Confirm the backend server is running. Check that `VITE_API_URL` is set before running `npm run dev`. |
| **Old container still running on re-deploy** | The workflow stops containers named `app-<applicationId>` before starting a new one. Check for naming conflicts in Docker. |

---

## Author

**Anisha Monteiro** — [@anisha0011](https://github.com/anisha0011)

---

## License

This project is built for academic and demonstration purposes as part of a cloud computing course project.

---

*Built with Node.js, React, Docker, GitHub Actions, and MongoDB Atlas*
