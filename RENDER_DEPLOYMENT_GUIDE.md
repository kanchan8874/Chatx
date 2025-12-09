# 🚀 ChatX - Render Deployment Guide

Complete guide to deploy ChatX on Render platform.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Code Changes Required](#code-changes-required)
7. [Post-Deployment Checklist](#post-deployment-checklist)

---

## 🔧 Prerequisites

### Required Accounts:
- ✅ Render account (https://render.com)
- ✅ MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)
- ✅ Cloudinary account (https://cloudinary.com)

### Required Information:
- MongoDB Atlas connection string
- Cloudinary credentials (Cloud Name, API Key, API Secret)
- JWT Secret key (generate a strong random string)

---

## 🖥️ Backend Deployment

### Step 1: Create Web Service on Render

1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repository
3. Select the repository containing ChatX
4. Configure settings:

**Basic Settings:**
- **Name:** `chatx-backend`
- **Environment:** `Node`
- **Region:** Choose closest to your users
- **Branch:** `main` (or your main branch)
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Advanced Settings:**
- **Instance Type:** Free tier (or upgrade for production)
- **Auto-Deploy:** Yes

### Step 2: Environment Variables for Backend

Add these environment variables in Render Dashboard:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatx?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS & URLs
CLIENT_URL=https://your-frontend-app.onrender.com
BACKEND_PORT=10000

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Important Notes:**
- `CLIENT_URL` should be your frontend Render URL (will be created later)
- `BACKEND_PORT` should be `10000` for Render (or use `process.env.PORT`)
- Generate a strong `JWT_SECRET` (use: `openssl rand -base64 32`)

### Step 3: Update Backend Code for Render

#### File: `backend/server.js`

**Current Code:**
```javascript
const PORT = process.env.BACKEND_PORT || 4000;
```

**Change To:**
```javascript
const PORT = process.env.PORT || process.env.BACKEND_PORT || 4000;
```

**Reason:** Render uses `PORT` environment variable automatically.

#### File: `backend/server.js`

**Current Code:**
```javascript
const CLIENT_URL = process.env.CLIENT_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
```

**Change To:**
```javascript
const CLIENT_URL = process.env.CLIENT_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Log for debugging
console.log("🌐 CORS configured for:", CLIENT_URL);
```

#### File: `backend/socket/server.js`

**Current Code:**
```javascript
const SOCKET_ORIGIN = process.env.CLIENT_URL || "http://localhost:3000";
```

**Change To:**
```javascript
const SOCKET_ORIGIN = process.env.CLIENT_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Log for debugging
console.log("🔌 Socket.io CORS configured for:", SOCKET_ORIGIN);
```

#### File: `backend/socket/server.js`

**Update CORS configuration:**
```javascript
export function initSocketServer(server) {
  io = new Server(server, {
    cors: {
      origin: SOCKET_ORIGIN,
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["polling", "websocket"],
    allowEIO3: true,
  });

  // ... rest of the code
}
```

### Step 4: Update package.json Scripts

**File: `backend/package.json`**

Ensure you have:
```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "lint": "eslint ."
  }
}
```

---

## 🎨 Frontend Deployment

### Step 1: Create Static Site on Render

1. Go to Render Dashboard → **New** → **Static Site**
2. Connect your GitHub repository
3. Select the repository containing ChatX
4. Configure settings:

**Basic Settings:**
- **Name:** `chatx-frontend`
- **Environment:** `Node`
- **Branch:** `main` (or your main branch)
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `.next`

**Advanced Settings:**
- **Auto-Deploy:** Yes

### Step 2: Environment Variables for Frontend

Add these environment variables in Render Dashboard:

```env
# Backend API URL (Your Render backend URL)
NEXT_PUBLIC_API_URL=https://chatx-backend.onrender.com

# Socket.io URL (Same as backend URL)
NEXT_PUBLIC_SOCKET_URL=https://chatx-backend.onrender.com

# Frontend URL (Your Render frontend URL - will be set automatically)
NEXT_PUBLIC_APP_URL=https://chatx-frontend.onrender.com
```

**Important Notes:**
- Replace `chatx-backend.onrender.com` with your actual backend Render URL
- Replace `chatx-frontend.onrender.com` with your actual frontend Render URL
- These URLs will be provided by Render after deployment

### Step 3: Update Frontend Code for Render

#### File: `frontend/lib/api-client.js`

**Current Code:**
```javascript
export function getBrowserApiBase() {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_BASE_URL ||
    "http://localhost:4000"
  );
}
```

**This is already correct!** It will use `NEXT_PUBLIC_API_URL` from environment variables.

#### File: `frontend/hooks/useSocket.js`

**Current Code:**
```javascript
const socketUrl =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? window.location.origin.replace(":3000", ":4000") : "http://localhost:4000");
```

**This is already correct!** It will use `NEXT_PUBLIC_SOCKET_URL` from environment variables.

#### File: `frontend/lib/constants.js`

**Current Code:**
```javascript
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || "http://localhost:4000";
```

**This is already correct!** It will use `NEXT_PUBLIC_API_URL` from environment variables.

### Step 4: Update next.config.mjs (if needed)

**File: `frontend/next.config.mjs`**

Ensure Cloudinary images are configured:
```javascript
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "res.cloudinary.com",
      pathname: "/**",
    },
  ],
},
```

**This is already configured!** ✅

---

## 🔐 Environment Variables Summary

### Backend Environment Variables (Render Dashboard)

| Variable | Value | Example |
|----------|-------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Strong random string | `your-secret-key` |
| `CLIENT_URL` | Frontend Render URL | `https://chatx-frontend.onrender.com` |
| `BACKEND_PORT` | Port number | `10000` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `your-api-key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your-api-secret` |

### Frontend Environment Variables (Render Dashboard)

| Variable | Value | Example |
|----------|-------|---------|
| `NEXT_PUBLIC_API_URL` | Backend Render URL | `https://chatx-backend.onrender.com` |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io URL (same as backend) | `https://chatx-backend.onrender.com` |
| `NEXT_PUBLIC_APP_URL` | Frontend Render URL | `https://chatx-frontend.onrender.com` |

---

## 🗄️ Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Cluster

1. Go to MongoDB Atlas → **Create Cluster**
2. Choose **Free Tier (M0)**
3. Select your preferred region
4. Create cluster

### Step 2: Configure Database Access

1. Go to **Database Access** → **Add New Database User**
2. Create username and password
3. Set user privileges: **Read and write to any database**
4. Save credentials securely

### Step 3: Configure Network Access

1. Go to **Network Access** → **Add IP Address**
2. Click **Allow Access from Anywhere** (for Render)
3. Or add Render's IP ranges (if available)

### Step 4: Get Connection String

1. Go to **Clusters** → Click **Connect**
2. Choose **Connect your application**
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Add database name: `chatx` (or your preferred name)

**Example:**
```
mongodb+srv://username:password@cluster.mongodb.net/chatx?retryWrites=true&w=majority
```

---

## ☁️ Cloudinary Setup

### Step 1: Create Cloudinary Account

1. Go to https://cloudinary.com
2. Sign up for free account
3. Go to Dashboard

### Step 2: Get Credentials

From Cloudinary Dashboard, copy:
- **Cloud Name**
- **API Key**
- **API Secret**

### Step 3: Add to Render Environment Variables

Add these to your backend environment variables in Render.

---

## 📝 Code Changes Checklist

### Backend Changes:

- [ ] Update `backend/server.js` - Change `PORT` to use `process.env.PORT`
- [ ] Verify CORS configuration uses `CLIENT_URL`
- [ ] Verify Socket.io CORS uses `CLIENT_URL`
- [ ] Remove debug routes in production (optional)

### Frontend Changes:

- [ ] No changes needed! ✅
- [ ] Code already uses environment variables correctly

---

## 🚀 Deployment Steps Summary

### 1. Deploy Backend First

1. Push code to GitHub
2. Create Web Service on Render
3. Set root directory: `backend`
4. Add environment variables
5. Deploy and get backend URL

### 2. Deploy Frontend Second

1. Create Static Site on Render
2. Set root directory: `frontend`
3. Add environment variables (use backend URL)
4. Deploy and get frontend URL

### 3. Update Backend CORS

1. Go to backend environment variables
2. Update `CLIENT_URL` with frontend URL
3. Redeploy backend

### 4. Test Deployment

1. Visit frontend URL
2. Test registration/login
3. Test real-time messaging
4. Test file uploads

---

## ✅ Post-Deployment Checklist

- [ ] Backend is running and accessible
- [ ] Frontend is running and accessible
- [ ] MongoDB connection is working
- [ ] Authentication is working
- [ ] Real-time messaging is working
- [ ] File uploads are working
- [ ] CORS is configured correctly
- [ ] Environment variables are set correctly
- [ ] SSL certificates are active (Render provides automatically)
- [ ] Test on mobile devices

---

## 🔧 Troubleshooting

### Backend Issues:

**Problem:** Backend not starting
- **Solution:** Check `PORT` environment variable, use `process.env.PORT`

**Problem:** CORS errors
- **Solution:** Verify `CLIENT_URL` matches frontend URL exactly

**Problem:** MongoDB connection failed
- **Solution:** Check `MONGODB_URI`, ensure IP is whitelisted in Atlas

### Frontend Issues:

**Problem:** API calls failing
- **Solution:** Check `NEXT_PUBLIC_API_URL` matches backend URL

**Problem:** Socket.io not connecting
- **Solution:** Check `NEXT_PUBLIC_SOCKET_URL` matches backend URL

**Problem:** Images not loading
- **Solution:** Verify Cloudinary credentials in backend

---

## 📞 Render URLs Format

### Backend URL Format:
```
https://chatx-backend.onrender.com
```

### Frontend URL Format:
```
https://chatx-frontend.onrender.com
```

**Note:** Render provides URLs automatically. Use these URLs in environment variables.

---

## 🎯 Quick Reference: Where to Add Render URLs

### Backend Code:
1. **Environment Variable:** `CLIENT_URL` = Frontend Render URL
2. **File:** `backend/server.js` - Uses `CLIENT_URL` for CORS
3. **File:** `backend/socket/server.js` - Uses `CLIENT_URL` for Socket.io CORS

### Frontend Code:
1. **Environment Variable:** `NEXT_PUBLIC_API_URL` = Backend Render URL
2. **Environment Variable:** `NEXT_PUBLIC_SOCKET_URL` = Backend Render URL
3. **File:** `frontend/lib/api-client.js` - Uses `NEXT_PUBLIC_API_URL`
4. **File:** `frontend/hooks/useSocket.js` - Uses `NEXT_PUBLIC_SOCKET_URL`

---

## 🎉 Success!

Once deployed, your ChatX application will be live at:
- **Frontend:** `https://your-app-name.onrender.com`
- **Backend:** `https://your-backend-name.onrender.com`

**Happy Deploying! 🚀**

