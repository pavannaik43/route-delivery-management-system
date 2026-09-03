# 🚀 Hatsun RDMS — Split Host Deployment Guide

This guide provides step-by-step instructions to host the **Hatsun Agro Products — Route Delivery Management System (RDMS)** using the **Split Host Method**:
- **Frontend SPA**: Hosted on **Vercel** (or **Netlify**) on global edge CDN.
- **Backend REST API**: Hosted on **Render** (or **Railway** / **Fly.io**) with persistent SQLite database storage.

---

## 🏛️ Architecture Overview

```
                      ┌───────────────────────────────────────────────┐
                      │              User Web Browser                 │
                      └──────────────┬─────────────────┬──────────────┘
                                     │                 │
              1. Loads UI & Assets   │                 │ 2. Authenticated REST API Calls
             (HTML / JS / CSS bundle)│                 │    (JWT + JSON Payload)
                                     ▼                 ▼
          ┌──────────────────────────────────┐   ┌──────────────────────────────────┐
          │      FRONTEND HOST (Vercel)      │   │      BACKEND HOST (Render)       │
          │                                  │   │                                  │
          │  • Vite + React 18 SPA           │   │  • Node.js + Express API         │
          │  • Tailwind CSS + Lucide Icons   │   │  • JWT Auth & RBAC Security      │
          │  • React Router + Recharts       │   │  • Transactional Stock Engine    │
          │  • Global High-Speed CDN Edge    │   │  • Sequential Invoice Generator  │
          └──────────────────────────────────┘   └────────────────┬─────────────────┘
                                                                  │
                                                                  ▼
                                                 ┌──────────────────────────────────┐
                                                 │     PERSISTENT STORAGE DISK      │
                                                 │   • SQLite (`database.sqlite`)   │
                                                 │   • Mounted at `/var/data`       │
                                                 └──────────────────────────────────┘
```

---

## 📋 Prerequisites

1. A **GitHub / GitLab** account with this repository pushed.
2. A free account on **[Render.com](https://render.com)** (or Railway/Fly.io).
3. A free account on **[Vercel.com](https://vercel.com)** (or Netlify).

---

## 🛠️ Step 1: Deploy Backend API (Render.com)

Deploy the backend first so you have the live API URL ready for the frontend.

### Option A: 1-Click Blueprint (Recommended)
1. In the Render Dashboard, click **New +** → **Blueprint**.
2. Connect your Git repository.
3. Render will automatically detect `render.yaml` and configure the Web Service and Persistent Disk.
4. Click **Apply**.

---

### Option B: Manual Web Service Setup
1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your repository.
3. Configure the settings:
   - **Name**: `hatsun-rdms-api`
   - **Region**: Closest to your users (e.g. `Singapore` / `Frankfurt` / `Oregon`)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add **Environment Variables**:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production mode |
   | `PORT` | `10000` | Render default port |
   | `JWT_SECRET` | *(Generate a 32+ character string)* | Secret for auth tokens |
   | `CORS_ORIGIN` | `*` *(or your Vercel URL)* | Allows frontend API requests |
   | `AUTO_SEED` | `true` | Auto-populates products/users on 1st run |
   | `DB_PATH` | `./database.sqlite` | Standard local path (No disk required) |

> [!NOTE]
> **No Disk Needed for Free Tier**: Render's Persistent Disks are only on paid plans. On Render Free Tier, simply **skip the Disks section entirely**. The application automatically stores the database in the local container directory (`./database.sqlite`) and auto-seeds initial data on every restart.

5. Click **Create Web Service**.
6. Once deployed, note down your live Backend URL:
   ```
   https://hatsun-rdms-api.onrender.com
   ```
8. Verify the health check in your browser:
   ```
   https://hatsun-rdms-api.onrender.com/api/health
   ```
   *(Expected response: `{"status":"healthy","app":"Hatsun RDMS API",...}`)*

---

## 🌐 Step 2: Deploy Frontend SPA (Vercel)

Now connect the React Vite frontend to your live backend.

1. Go to **[Vercel Dashboard](https://vercel.com/dashboard)** → Click **Add New...** → **Project**.
2. Import your GitHub repository.
3. In the project configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and choose `frontend`
   - **Build Command**: `npm run build` *(detected automatically)*
   - **Output Directory**: `dist` *(detected automatically)*
4. Expand **Environment Variables** and add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://hatsun-rdms-api.onrender.com/api` *(replace with your actual backend URL + `/api`)* |
5. Click **Deploy**.
6. Vercel will build and assign you a global URL (e.g., `https://hatsun-rdms.vercel.app`).

> [!TIP]
> `frontend/vercel.json` is already included to automatically route all SPA URLs (e.g. `/dashboard`, `/dispatch`, `/products`, `/invoices`) to `index.html` without 404 errors.

---

## ⚡ Step 2 Alternative: Deploy Frontend on Netlify

If using Netlify instead of Vercel:
1. Log into **[Netlify](https://app.netlify.com)** → **Add new site** → **Import an existing project**.
2. Select your repository.
3. Configure Build Settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. In **Site configuration** → **Environment variables**, add:
   - `VITE_API_BASE_URL` = `https://hatsun-rdms-api.onrender.com/api`
5. Click **Deploy Site**.

---

## 🔐 Default Credentials (Ready on First Launch)

The database automatically seeds on first launch with sample Hatsun products, retail shops, delivery routes, and test accounts:

| Role | Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Full access: Master Catalog, Shops, Loading, Invoices, Analytics, User Management |
| **Delivery Staff** | `driver1` | `driver123` | Field access: Live Dispatch, Route Delivery, Invoice Generation |
| **Delivery Staff** | `driver2` | `driver123` | Field access: Live Dispatch, Route Delivery, Invoice Generation |

---

## 🐳 Alternative: Split Hosting with Docker Compose

If you are hosting on an **Ubuntu VPS**, **DigitalOcean Droplet**, **AWS EC2**, or **Google Cloud Compute Engine**:

1. Clone the repository on your server:
   ```bash
   git clone https://github.com/pavannaik43/route-delivery-management-system.git
   cd route-delivery-management-system
   ```
2. Launch the split containers:
   ```bash
   docker compose up -d --build
   ```
3. The services will start:
   - **Frontend**: `http://<SERVER_IP>:3000`
   - **Backend API**: `http://<SERVER_IP>:5000/api`
   - **Database Volume**: Automatically persisted in Docker volume `hatsun_rdms_sqlite_data`.

---

## 🔍 Verification & Health Check Checklist

After deployment, test the following:

- [ ] **Backend Health Check**: Open `https://your-backend.onrender.com/api/health` → Status 200 `healthy`.
- [ ] **Frontend Homepage**: Open `https://your-frontend.vercel.app` → Redirects to login page.
- [ ] **Login Flow**: Log in as `admin` / `admin123`.
- [ ] **Catalog & Stock**: Verify Hatsun product catalog (Arokya Milk, Curd, Ghee, Paneer, Arun Ice Cream) loads.
- [ ] **Dispatch & Invoice**: Execute a delivery test order and generate a PDF tax invoice.
- [ ] **Page Refresh**: Refresh on `/reports` or `/shops` → SPA routes correctly without 404.

---

## ❓ Troubleshooting Common Deployment Issues

### 1. "Network Error" on Hosted Login (Valid or Invalid Credentials)
If you see **"Network Error"** on Vercel or Netlify when clicking Sign In, follow these steps:

1. **Check Environment Variables on Vercel/Netlify**:
   - In Vite applications, environment variables must be defined **before or during build time**.
   - Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**.
   - Ensure the following variable is present:
     - **Key**: `VITE_API_BASE_URL`
     - **Value**: `https://your-backend-api.onrender.com/api` *(replace with your actual Render URL)*
   - > [!IMPORTANT]
     > **You MUST Trigger a Redeployment** after adding or modifying environment variables! (Go to **Deployments** tab → Click the **•••** menu on latest deployment → Click **Redeploy**).

2. **Verify the Backend is Awake & Healthy**:
   - Open your backend health URL directly in your browser:
     ```
     https://your-backend-api.onrender.com/api/health
     ```
   - If it responds with `{"status":"healthy",...}`, your backend is live.
   - **Render Free Tier Cold Starts**: Render's free tier automatically spins down instances after 15 minutes of inactivity. When you open the hosted website and log in for the first time, Render takes **30–50 seconds** to boot up. The Login page includes an automatic wake-up indicator and timer.

3. **Verify CORS Settings on Render**:
   - In **Render Dashboard** → Your Web Service → **Environment Variables**, verify:
     - `CORS_ORIGIN` = `*` (or your exact Vercel frontend URL, e.g. `https://hatsun-rdms.vercel.app`).

---

### 2. CORS Blocked in Browser Console
- If your browser console displays `Access to XMLHttpRequest has been blocked by CORS policy`:
  - Ensure the backend has deployed with the latest code containing dynamic CORS headers and `OPTIONS` preflight support.
  - Test `/api/health` from the browser to ensure the server is serving requests.

---

### 3. Data Persistence on Render Free Tier vs Paid Tier
- **Render Free Tier**: Stores the SQLite database in local container storage (`./database.sqlite`). The system automatically seeds sample data on each container restart so testing is never blocked.
- **Render Paid Plan ($7/mo)**: You can attach a Persistent Disk at `/var/data` and set `DB_PATH=/var/data/database.sqlite` for permanent persistence across manual service rebuilds.

