# 3-Tier Architecture Suite (Decoupled Microservices)

A complete demonstration of a decoupled **3-Tier Architecture** utilizing **Frontend (Single Page Application)**, **Auth Backend (Node.js + Express + MySQL)**, and **Core Backend (Node.js + Express + MySQL)**.

---

## 🏛 Architecture Overview

```
                          ┌────────────────────────┐
                          │   Frontend Web App     │
                          │   (Port 3000)          │
                          └──────────┬─────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
                 ▼                                       ▼
      [Auth Transactions]                      [Protected Data & APIs]
                 │                                       │
                 ▼                                       ▼
    ┌─────────────────────────┐             ┌─────────────────────────┐
    │  Auth Backend (Node.js) │             │  Core Backend (Node.js) │
    │  (Port 5001)            │             │  (Port 5002)            │
    └────────────┬────────────┘             └────────────┬────────────┘
                 │                                       │
                 ▼                                       ▼
    ┌─────────────────────────┐             ┌─────────────────────────┐
    │  arch_auth_db (MySQL)   │             │  arch_core_db (MySQL)   │
    │  - users                │             │  - user_profiles        │
    │  - sessions             │             │  - dashboard_metrics    │
    │                         │             │  - activities           │
    └─────────────────────────┘             └─────────────────────────┘
```

---

## 🚀 Key Features

1. **Feature 1: Registration Page (`#register`)**
   - Collects user credentials (Full Name, Username, Email, Password).
   - Hashes passwords using `bcryptjs`.
   - Stores account records exclusively inside `arch_auth_db.users`.

2. **Feature 2: Login Page (`#login`)**
   - Validates user identity against `arch_auth_db`.
   - Generates signed **JSON Web Tokens (JWT)** with 24-hour expiration.
   - Stores active sessions inside `arch_auth_db.sessions` with revocation tracking.
   - Provides a "One-Click Demo Account" button for quick validation.

3. **Feature 3: Protected Dashboard Landing Page (`#dashboard`)**
   - **Cross-tier verification**: Automatically injects JWT Bearer token into HTTP headers.
   - **Core Backend Data**: Queries `arch_core_db` for user metrics, profile details, and audit history.
   - **Interactive Core Action**: Allows dispatching new audit events via `POST /api/core/activity` directly into `arch_core_db`.
   - **Logout**: Revokes session in `arch_auth_db` and returns client to `#login`.

---

## 🛠 Prerequisites & Installation

- **Node.js** >= v18
- **MySQL 8.0** running on `localhost:3306`

### 1. Initialize MySQL Databases
```bash
npm run db:init
```
*Creates `arch_auth_db` and `arch_core_db` with all tables and pre-seeds a demo user (`demo_user` / `Password123!`).*

### 2. Launch All 3 Tiers Concurrently
```bash
npm start
```
Starts:
- **Frontend App**: `http://localhost:3000`
- **Auth Backend**: `http://localhost:5001`
- **Core Backend**: `http://localhost:5002`

---

## 🧪 API Endpoints

### Auth Backend (`http://localhost:5001`)
| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| `GET`  | `/health` | Service & DB Health Check | No |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate & issue JWT | No |
| `POST` | `/api/auth/logout` | Revoke session & token | Bearer Token |
| `GET`  | `/api/auth/verify` | Verify token signature & claims | Bearer Token |

### Core Backend (`http://localhost:5002`)
| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| `GET`  | `/health` | Service & DB Health Check | No |
| `GET`  | `/api/core/dashboard` | Fetch user profile & telemetry | Bearer Token |
| `POST` | `/api/core/activity` | Record audit activity in Core DB | Bearer Token |

---

## 🛡 Security & Decoupling Highlights
- **Decoupled Databases**: Auth credentials are strictly stored in `arch_auth_db`, while application business objects and activities reside in `arch_core_db`.
- **Stateless Verification**: Core backend verifies incoming JWT tokens cryptographically without direct access to the `users` table password hashes.
