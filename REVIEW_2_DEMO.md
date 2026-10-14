# DeployPulse — Review 2 Live Demonstration Runbook
### DevOps Community Hackathon 2026 | DevSprint 2026
**Team**: DEVNEST (*Nithyanandam N, Sabareesh S S, Purushothaman L*)  
**Problem Statement**: Problem 1 – Automated CI/CD Pipeline for Web Applications  
**Live Target**: `http://20.196.98.125/`  
**Repository**: [github.com/nnithyanandam024/deploypulse-azure-cicd](https://github.com/nnithyanandam024/deploypulse-azure-cicd)  

---

## 1. Demonstration Purpose & Evaluation Criteria

The primary objective of Review 2 is to prove that the CI/CD pipeline enforces a strict **Deployment Quality Gate** (**Success Criterion SC-03**):
> *"If the automated tests fail, the workflow stops before the build and deployment stages, preventing an invalid change from being released through the pipeline."*

---

## 2. The 3-Act Demonstration Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ACT 1: BASELINE LIVE STATE                      │
│ Commit: 58e8057 | Tests: PASS ✅ | Status: HEALTHY | Version: 58e8057   │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ACT 2: QUALITY GATE FAILURE                     │
│ Commit: 5da8b99 | Tests: FAIL ❌ | Build & Deploy: SKIPPED 🚫          │
│ Live URL: Still running 58e8057 (Zero downtime, broken code BLOCKED)   │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ACT 3: AUTOMATED RECOVERY                       │
│ Commit: a16a094 | Tests: PASS ✅ | Deploy: SUCCESS 🎉                  │
│ Live URL: Automatically updated to a16a094 (Self-healing verified)    │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Act 1: Baseline Working Deployment (Healthy State)

1. **Open the live application**:
   - Dashboard: [http://20.196.98.125/](http://20.196.98.125/)
   - Health Probe: [http://20.196.98.125/health](http://20.196.98.125/health)
   - Release Metadata: [http://20.196.98.125/api/info](http://20.196.98.125/api/info)
2. **What to Show the Judges**:
   - The application is running on Microsoft Azure (`Standard_B2als_v2` in `koreacentral`).
   - Nginx reverse proxy handles public port 80 and securely forwards to internal Node.js container on port 3000.
   - Release metadata shows the exact Git commit SHA:
     ```json
     {
       "app": "DeployPulse",
       "version": "58e8057267aee262cf858ce9ded087a6ffe00f74",
       "node": "v22.23.3",
       "uptime": 28
     }
     ```

---

### Act 2: Quality Gate Enforcement (Failure Demonstration)

1. **The Scenario**:
   A developer pushes code containing an assertion failure or regression bug (`test: simulate quality gate assertion failure`).
   - **Commit SHA**: `5da8b99`
2. **Open GitHub Actions Run History**:
   - Navigate to: **[Actions Tab](https://github.com/nnithyanandam024/deploypulse-azure-cicd/actions)**
   - Click the workflow run for commit **`5da8b99`**.
3. **What to Show the Judges**:
   - ❌ **Stage 3 (`3. Run Automated Quality Gate Tests`)**: Fails with non-zero exit code due to assertion mismatch.
   - 🚫 **Stage 4 (Docker Validate)**: **Skipped**
   - 🚫 **Stage 5 (Docker Build)**: **Skipped**
   - 🚫 **Stage 6 (Deploy Services)**: **Skipped**
   - 🚫 **Stage 7 (Smoke Tests)**: **Skipped**
   - 📋 **Stage 8 (Diagnostics)**: Retains evidence logs (`if: always()`).
4. **The Critical Proof (Zero-Downtime Live Check)**:
   - Refresh [http://20.196.98.125/api/info](http://20.196.98.125/api/info).
   - Point out to evaluators:
     > *"Notice that despite the failed push, our live Azure deployment was NOT taken down and the bad commit was NOT deployed. The server remained safe and operational on the previous stable release `58e8057`."*

---

### Act 3: Automated Self-Healing & Successful Promotion

1. **The Scenario**:
   The developer reverts the faulty commit (`Revert "test: simulate quality gate assertion failure"`).
   - **Commit SHA**: `a16a094`
2. **Open GitHub Actions Run History**:
   - Click the workflow run for commit **`a16a094`**.
3. **What to Show the Judges**:
   - ✅ **Stage 1 (Checkout)**: Passed
   - ✅ **Stage 2 (Setup Node.js 22)**: Passed
   - ✅ **Stage 3 (Automated Quality Gate Tests)**: 4/4 Tests Passed
   - ✅ **Stage 4 (Docker Compose Validation)**: Passed
   - ✅ **Stage 5 (Docker Image Build)**: Built `node:22-alpine` image with `--pull`
   - ✅ **Stage 6 (Container Deployment)**: `APP_VERSION=a16a094... docker compose up -d`
   - ✅ **Stage 7 (Smoke Testing)**: Automated `curl` verification to `/health` and `/api/info` returned HTTP 200
   - ✅ **Stage 8 (Diagnostics)**: Captured running container status
4. **Live Verification**:
   - Refresh [http://20.196.98.125/api/info](http://20.196.98.125/api/info):
     ```json
     {
       "app": "DeployPulse",
       "version": "a16a094234444353413c4da2e71e0e8bc4ac0345",
       "node": "v22.23.3",
       "uptime": 90,
       "timestamp": "2026-10-14T06:21:25.621Z"
     }
     ```
   - Point out to evaluators:
     > *"The live server automatically promoted to version `a16a094` without any manual SSH or terminal commands on the Azure server. Total pipeline duration: under 40 seconds."*

---

## 3. Evidence Matrix for Evaluators

| Commit SHA | Commit Message | Test Status | Build / Deploy Status | Live App Impact | Verification Evidence |
|:---:|:---|:---:|:---:|:---|:---|
| **`b1264fb`** | `feat: initial commit for DeployPulse` | ✅ Passed | ✅ Deployed | Live deployed to Azure | [Run #1](https://github.com/nnithyanandam024/deploypulse-azure-cicd/actions) |
| **`58e8057`** | `docs: update README with live URLs` | ✅ Passed | ✅ Deployed | Version updated on live site | [Run #2](https://github.com/nnithyanandam024/deploypulse-azure-cicd/actions) |
| **`5da8b99`** | `test: simulate quality gate assertion failure` | ❌ **Failed** | 🚫 **Blocked** | **Unchanged (Stayed on `58e8057`)** | [Run #3 (Red ❌)](https://github.com/nnithyanandam024/deploypulse-azure-cicd/actions) |
| **`a16a094`** | `Revert "test: simulate quality gate..."` | ✅ Passed | ✅ Deployed | **Updated live to `a16a094`** | [Run #4 (Green ✅)](https://github.com/nnithyanandam024/deploypulse-azure-cicd/actions) |

---

## 4. Evaluation Criteria Checklist

- [x] **SC-01**: A push to the main branch triggers the workflow automatically.
- [x] **SC-02**: Automated tests execute successfully before build and deploy.
- [x] **SC-03**: Failed tests prevent deployment (proven in Run #3 with commit `5da8b99`).
- [x] **SC-04**: Docker image builds and runs in containerized environment on Azure VM.
- [x] **SC-05**: Application is accessible over the internet at `http://20.196.98.125/`.
- [x] **SC-06**: Deployment and application logs are captured in GitHub Actions run artifacts.
