# DeployPulse

> **Automated CI/CD Pipeline for Web Applications**  
> **DevOps Community Hackathon 2026** — Bannari Amman Institute of Technology  
> **Team**: DEVNEST (*Nithyanandam N, Sabareesh S S, Purushothaman L*)  
> **Problem Statement**: Problem 1 – Automated CI/CD Pipeline for Web Applications  

---

## 1. Project Overview

**DeployPulse** is a lightweight, production-grade automated CI/CD pipeline and web status service built with **Node.js 22**, **Docker**, **Nginx**, and **GitHub Actions**, deployed to an **Ubuntu Linux VM on Microsoft Azure**.

### 🌐 Live Production Deployment
- **Dashboard URL**: [http://20.196.98.125/](http://20.196.98.125/)
- **Health Probe**: [http://20.196.98.125/health](http://20.196.98.125/health)
- **Release Metadata**: [http://20.196.98.125/api/info](http://20.196.98.125/api/info)
- **Azure Host**: `vm-deploypulse` (`koreacentral`, `Standard_B2als_v2`)

Whenever a developer pushes code to the `main` branch, GitHub Actions automatically executes the pipeline:
1. Runs automated unit and HTTP route tests (**Quality Gate**).
2. Validates Docker Compose configuration.
3. Builds the production Docker image.
4. Deploys the application and Nginx reverse proxy to the Azure virtual machine.
5. Injects the Git commit SHA as the active release identifier.
6. Executes post-deployment HTTP smoke tests (`/health` and `/api/info`).
7. Captures container status and diagnostic logs.

If any test fails at Stage 3, the pipeline **immediately halts**, strictly blocking the build and deployment stages.


---

## 2. Technology Stack

| Technology | Purpose |
|:---|:---|
| **Microsoft Azure** | Cloud virtual machine hosting (Ubuntu Linux) |
| **Ubuntu Linux** | Server operating system & Docker container runtime |
| **Git & GitHub** | Source code version control & repository hosting |
| **GitHub Actions** | Self-hosted automated CI/CD pipeline runner |
| **Node.js 22** | Lightweight application runtime using native HTTP & test modules |
| **Docker** | Application containerization (unprivileged `node:22-alpine`) |
| **Docker Compose** | Multi-container orchestration (App + Nginx reverse proxy) |
| **Nginx** | Public reverse proxy, security headers & HTTP port 80 routing |

---

## 3. Azure Student Offer ($100 Credit) Optimization Guide

To preserve your $100 Azure student credits throughout the hackathon and evaluation period:

1. **Recommended VM Size**:
   - Use `Standard_B1s` (1 vCPU, 1 GiB RAM — ~$0.0104/hr / ~$7.50/month) or `Standard_B2s` (2 vCPU, 4 GiB RAM — ~$0.0416/hr).
   - DeployPulse uses lightweight Alpine Linux images (`node:22-alpine` and `nginx:alpine`). Total container memory consumption is under **120 MB**, comfortably running on a low-cost `B1s` instance.
2. **OS Disk**:
   - Select **Standard SSD (E4/E6 - 32GB to 64GB)** instead of Premium SSD to minimize disk cost.
3. **Configure Auto-Shutdown**:
   - In Azure Portal, navigate to your VM > **Operations** > **Auto-shutdown**.
   - Set auto-shutdown at 11:00 PM (or end of your work session) with notification to avoid overnight credit burn.
4. **Deallocate when Inactive**:
   - When not actively developing or presenting to judges, click **Stop** (Deallocate) in the Azure portal. (Deallocated VMs incur $0 compute charges; only the small disk cost applies).

---

## 4. Architecture & Networking

```
+-----------------------------------------------------------------------------------+
| Azure Virtual Machine (Ubuntu Linux)                                              |
|                                                                                   |
|   Public Internet (Port 80/TCP)                                                   |
|          │                                                                        |
|          ▼                                                                        |
|   ┌───────────────┐        Docker Bridge Network (deploypulse-net)                |
|   │     Nginx     │ ──────────────────────────────────────┐                       |
|   │ Reverse Proxy │                                       ▼                       |
|   │   (Port 80)   │                               ┌───────────────┐               |
|   └───────────────┘                               │  Node.js App  │               |
|                                                   │  (Port 3000)  │               |
|   GitHub Actions Runner (Service)                 │  (Internal)   │               |
|   Executes CI/CD steps directly on host           └───────────────┘               |
+-----------------------------------------------------------------------------------+
```

### Network Security Group (NSG) Rules
- **Port 80 / TCP**: Allow Inbound (`Source: Any`, `Destination: Any`) — For public HTTP access.
- **Port 22 / TCP**: Allow Inbound (`Source: My IP` or trusted IP) — For SSH management.
- **Port 3000 / TCP**: **Blocked from public internet** — Strictly accessible internally via Nginx.

---

## 5. Application Endpoints

| Method | Path | Content-Type | Description |
|:---:|:---|:---:|:---|
| `GET` | `/` | `text/html` | Minimalist DevOps status dashboard with live uptime and release badge |
| `GET` | `/changes` | `text/html` | Visual changelog & Quality Gate deployment trace |
| `GET` | `/health` | `application/json` | Health probe returning `{"status":"ok","app":"DeployPulse","uptime":...}` |
| `GET` | `/api/info` | `application/json` | Release information returning Git commit SHA and runtime metadata |
| `*` | Any unknown | `application/json` | HTTP 404 response with `{"error":"Not Found","path":"..."}` |

---

## 6. Project Structure

```
DeployPulse/
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # GitHub Actions Quality Gate CI/CD workflow
├── src/
│   ├── server.js                 # Node.js 22 server (Dashboard, /changes, /health, /api/info)
│   └── views/
│       ├── index.html            # Main dashboard HTML template (customizable banner)
│       └── changes.html          # Visual changelog and deployment history
├── test/
│   └── server.test.js            # Automated test suite (TC-01 through TC-05)
├── nginx/

│   └── default.conf              # Nginx reverse proxy configuration & security headers
├── .dockerignore                 # Excludes test, git, and local scratch files
├── .gitignore                    # Standard Node.js & IDE gitignore
├── Dockerfile                    # Unprivileged node:22-alpine production container
├── docker-compose.yml            # Container definitions, networks, and healthchecks
├── package.json                  # Application metadata & test scripts
└── README.md                     # Comprehensive documentation & setup instructions
```

---

## 7. Step-by-Step Setup Guide

### 7.1 Local Verification (Development Machine)

1. **Run Automated Tests**:
   ```bash
   npm test
   ```
   *Expected output*: 4 tests executed, 4 passed (TC-01, TC-02, TC-03, TC-04).

2. **Validate Docker Compose Configuration**:
   ```bash
   docker compose config --quiet
   ```

3. **Start Containers Locally**:
   ```bash
   docker compose up -d --build
   ```

4. **Verify Local Endpoints**:
   ```bash
   curl http://localhost/health
   curl http://localhost/api/info
   ```
   Open `http://localhost/` in your browser.

5. **Stop Containers**:
   ```bash
   docker compose down
   ```

---

### 7.2 Azure Virtual Machine Provisioning

1. Log in to the [Azure Portal](https://portal.azure.com/).
2. Click **Create a resource** > **Virtual machine**.
3. Fill in the parameters:
   - **Resource group**: `rg-deploypulse` (create a new one in the same region as the VM).
   - **VM name**: `vm-deploypulse`.
   - **Region**: **`Central India`** (or **`South India`** / **`West India`**).
     > **Important for Azure Student Accounts**: Azure for Students restricts resource deployment to designated regional data centers (typically `Central India` for Indian student subscriptions). Selecting restricted regions like `East US` triggers a `RequestDisallowedByAzure` policy error.
   - **Image**: `Ubuntu Server 24.04 LTS - x64` (or `22.04 LTS`).
   - **Size**: `Standard_B1s` (1 vCPU, 1 GiB RAM) or `Standard_B2s`.
   - **Authentication**: SSH Public Key (or Password for simplicity).
4. **Networking**:
   - Allow ports `22` (SSH) and `80` (HTTP).
   - Ensure a Public IP address is created.
5. Connect via SSH:
   ```bash
   ssh -i <your-key.pem> azureuser@<YOUR_AZURE_VM_PUBLIC_IP>
   ```


---

### 7.3 Installing Prerequisites on the Azure VM

Run the following commands on your Azure VM:

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Git, curl, and prerequisites
sudo apt install -y git curl ca-certificates gnupg

# Install Docker Engine & Docker Compose plugin
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Allow runner user to manage Docker without sudo
sudo usermod -aG docker $USER
newgrp docker

# Verify Docker installation
docker --version
docker compose version
```

---

### 7.4 Setting Up the GitHub Actions Self-Hosted Runner

1. In your GitHub repository (`deploypulse-azure-cicd`), navigate to:  
   **Settings** > **Actions** > **Runners** > **New self-hosted runner**.
2. Select **OS: Linux**, **Architecture: x64**.
3. On your Azure VM, run the exact download and config commands provided by GitHub:
   ```bash
   mkdir actions-runner && cd actions-runner
   curl -o actions-runner-linux-x64-VERSION.tar.gz -L <GITHUB_RUNNER_DOWNLOAD_URL>
   tar xzf ./actions-runner-linux-x64-VERSION.tar.gz
   ./config.sh --url https://github.com/<YOUR_USER>/deploypulse-azure-cicd --token <TOKEN>
   ```
4. Install and start the runner as a persistent systemd service:
   ```bash
   sudo ./svc.sh install
   sudo ./svc.sh start
   sudo ./svc.sh status
   ```
5. Check your GitHub repository: The runner status should now show as **Idle** / **Online** (Green dot).

---

## 8. Demonstrating the Deployment Quality Gate (Criteria SC-03)

To demonstrate to hackathon evaluators that failing tests block deployment:

1. **Observe Passing State**:
   - The application is currently running at `http://<AZURE_VM_IP>/`.
   - `/api/info` displays the current commit SHA.

2. **Introduce an Intentional Test Failure**:
   Edit `test/server.test.js` and change an assertion to an impossible value:
   ```javascript
   // In test/server.test.js
   assert.equal(data.status, 'intentionally_broken_status');
   ```

3. **Commit & Push to `main`**:
   ```bash
   git add test/server.test.js
   git commit -m "test: simulate quality gate assertion failure"
   git push origin main
   ```

4. **Show GitHub Actions Execution**:
   - Stage 3 (`3. Run Automated Quality Gate Tests`) fails with a red cross (❌).
   - Notice that Stages 4, 5, 6, and 7 are **Skipped**.
   - Show the live Azure URL: The previously running application remains alive and unaffected because the deployment step was prevented!

5. **Revert & Restore Green State**:
   ```bash
   git revert HEAD --no-edit
   git push origin main
   ```
   - Stage 3 passes (✅).
   - Docker build and deployment complete.
   - Live Azure `/api/info` reflects the new Git commit SHA.

---

## 9. Hackathon 3-5 Minute Presentation Runbook

| Timestamp | Action | Key Talking Points |
|:---|:---|:---|
| **0:00 - 0:45** | Open Azure Portal & Architecture Diagram | Explain the architecture: Azure Ubuntu VM running Docker Compose behind an Nginx reverse proxy. |
| **0:45 - 1:30** | Open Live Application in Browser | Show `http://<VM_IP>/`, `/health` (Docker probe), and `/api/info` displaying current commit SHA. |
| **1:30 - 2:30** | Make a code edit & push to `main` | Open GitHub Actions tab. Show pipeline auto-trigger, unit tests executing, and Docker build. |
| **2:30 - 3:30** | Quality Gate Demonstration | Show the failed test run in Actions history where deployment was blocked (SC-03). |
| **3:30 - 4:00** | Diagnostic Logs & Wrap-up | Show post-deployment smoke tests and container logs. Summarize team contributions. |

---

## 10. License & Credits

Developed by **Team DEVNEST** for the **DevOps Community Hackathon 2026** at Bannari Amman Institute of Technology.  
Licensed under the [MIT License](LICENSE).
