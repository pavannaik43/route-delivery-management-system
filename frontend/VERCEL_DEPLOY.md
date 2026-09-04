# Vercel Deployment Configuration

This directory should be set as the **Root Directory** in Vercel project settings.

## Environment Variables Required in Vercel

Add these in your Vercel project settings (Settings → Environment Variables):

```
VITE_API_BASE_URL=https://your-backend-api.onrender.com
```

Replace `your-backend-api.onrender.com` with your actual Render backend URL.

## Build Settings

- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (or leave empty, Vercel auto-detects)
- **Output Directory**: `dist` (default for Vite)
- **Install Command**: `npm install`

## Deployment Instructions

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `pavannaik43/route-delivery-management-system`
4. **Configure Project**:
   - **Root Directory**: Set to `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: Leave empty (auto-detected) or use `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variable:
   - Key: `VITE_API_BASE_URL`
   - Value: `https://your-backend-api.onrender.com`
6. Click "Deploy"

### Option 2: Deploy via Git Push

Simply push to your GitHub repository's master branch, and Vercel will auto-deploy if connected.

```bash
git push origin master
```

## Troubleshooting

### Build fails with "No such file or directory"
- Ensure Root Directory is set to `frontend` in Vercel project settings
- Check that `frontend/package.json` exists

### Frontend can't connect to backend
- Verify `VITE_API_BASE_URL` environment variable is set correctly in Vercel
- Make sure the backend URL includes `/api` at the end (e.g., `https://your-api.onrender.com/api`)
- Check that CORS is properly configured in backend to allow your Vercel domain

### Build succeeds but page is blank
- Check browser console for errors
- Verify environment variables are set
- Make sure API URL is correct and backend is running

## Testing Locally

Test the production build locally:

```bash
cd frontend
npm run build
npm run preview
```

Then visit http://localhost:4173
