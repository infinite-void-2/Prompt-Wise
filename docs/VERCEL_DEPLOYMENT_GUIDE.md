# Vercel Deployment Guide for PromptWise

This guide provides step-by-step instructions to deploy **PromptWise** (Vite + React frontend & Node.js/Express backend) to **Vercel** with full production optimization, serverless API support, and zero CORS issues.

---

## 🏗️ Architecture Overview

The project is structured as a monorepo containing:
- **`client/`**: React 18 + Vite frontend Single Page Application (SPA).
- **`server/`**: Express API engine powered by Google Gemini and NVIDIA Nemotron LLM services.
- **`api/index.js`**: Vercel Serverless Function bridge connecting Vercel HTTP requests directly to the Express application.
- **`vercel.json`**: Root configuration directing static traffic to `client/dist` and routing API traffic to `/api/index.js`.

### Why this setup is optimal:
1. **Single Project & Unified Domain**: Frontend and API live on the exact same domain (e.g. `https://prompt-wise.vercel.app`), completely eliminating cross-origin (CORS) blocks and cookie restrictions.
2. **Auto-scaling Serverless Backend**: Express runs as a Vercel Serverless Function with Fluid compute, scaling to zero when idle and instantly scaling on demand.
3. **SPA Deep-Linking**: Client-side routing seamlessly rewrites non-API routes to `index.html` without breaking `/api/*` endpoints.

---

## 🚀 Deployment Method 1: Vercel Web Dashboard (Recommended)

This is the standard and easiest deployment method. Every `git push` to your repository automatically triggers a preview or production deployment.

### Step 1: Push Changes to GitHub
Make sure all configuration changes are committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "Configure Vercel deployment with serverless Express API bridge"
git push origin main
```

### Step 2: Import Project into Vercel
1. Log in to [vercel.com](https://vercel.com).
2. Click **"Add New..."** > **"Project"**.
3. Under **"Import Git Repository"**, find `Prompt-Wise` (or your repository name) and click **"Import"**.

### Step 3: Configure Project Settings
In the configuration screen:
- **Project Name**: `prompt-wise` (or your preferred name).
- **Framework Preset**: Select **"Vite"** or leave as **"Other"** (Vercel reads `vercel.json` automatically).
- **Root Directory**: Leave as `./` (the root of the repository). **Do NOT select `client` or `server`**.
- **Build and Output Settings**:
  - Automatically inferred from `vercel.json`:
    - **Build Command**: `npm run build`
    - **Output Directory**: `client/dist`
    - **Install Command**: `npm install`

### Step 4: Add Environment Variables
Expand the **"Environment Variables"** section and add the following keys:

| Variable Name | Required | Description | Example / Recommended Value |
|---|---|---|---|
| `GEMINI_API_KEY` | Recommended | Google Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey) | `AIzaSy...` |
| `NVIDIA_API_KEY` | Recommended | NVIDIA NIM API key from [NVIDIA Build](https://build.nvidia.com) | `nvapi-...` |
| `DEFAULT_MODEL` | Optional | Active default LLM model ID | `nvidia/nemotron-3.5-bolt-e4b` or `gemini-3.5-flash-lite` |
| `GEMINI_MODEL` | Optional | Gemini model identifier | `gemini-3.5-flash-lite` |
| `NVIDIA_MODEL` | Optional | Nemotron model identifier | `nvidia/nemotron-3.5-bolt-e4b` |
| `ENABLE_PROMPT_HISTORY` | Optional | Persistent DB storage flag (keep `false` for serverless MVP) | `false` |
| `REQUEST_TIMEOUT_MS` | Optional | Request timeout in milliseconds | `45000` |

> [!TIP]
> You only need either `GEMINI_API_KEY` or `NVIDIA_API_KEY` to start optimizing prompts. Having both enables automatic fallback and multi-model comparison.

### Step 5: Click Deploy
Click **"Deploy"**. Vercel will install dependencies across both workspaces, compile the server and client bundles, configure the serverless function, and give you your production URL (e.g. `https://prompt-wise.vercel.app`).

---

## 💻 Deployment Method 2: Vercel CLI (Direct from Terminal)

If you prefer deploying directly from your command line:

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Link Project & Set Environment Variables
```bash
vercel link
```

Add your environment variables:
```bash
vercel env add GEMINI_API_KEY production
vercel env add NVIDIA_API_KEY production
```

### Step 4: Deploy to Production
```bash
vercel --prod
```

---

## 🔍 Verification & Health Checks

Once deployed, verify that both the frontend and serverless API endpoints are operating correctly:

### 1. Test API Health
Open your browser or run:
```bash
curl https://<your-project-name>.vercel.app/api/health
```
**Expected Response (HTTP 200)**:
```json
{
  "status": "ok",
  "service": "PromptWise API",
  "model": "nvidia/nemotron-3.5-bolt-e4b",
  "hasApiKey": true,
  "providers": {
    "nvidia": true,
    "google": true
  },
  "version": "1.4.0"
}
```

### 2. Test Frontend UI
Navigate to `https://<your-project-name>.vercel.app/`:
1. Check the header status badge in the top right:
   - If keys are configured, it will display a green **"Engine Online"** badge.
   - If keys are missing, click **"API Keys"** to view instructions.
2. Enter a sample prompt (e.g. *"Write a python script to fetch weather"*).
3. Click **"Optimize Prompt"**.
4. Observe the streaming progress stage indicator and verify that both the **High-Context Variant** and **Low-Token Variant** render with metrics.

---

## 🛠️ Configuration Details & Customization

### Local Development Continues Unchanged
Your local workflow remains 100% identical:
```bash
npm run dev
```
- Frontend runs at `http://localhost:5173`
- Backend runs at `http://localhost:4000`
- Vite proxies `/api` directly to the local Express server.

### Optional: Pointing Frontend to an External Backend
If you ever want to host the backend separately (e.g., on Render, Railway, or AWS) while keeping the frontend on Vercel:
1. In your Vercel Project Settings, add the environment variable:
   ```
   VITE_API_BASE_URL=https://your-backend.onrender.com
   ```
2. Redeploy the frontend. The client will automatically route all requests to your external backend.
