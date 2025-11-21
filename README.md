# HollaCaller Project

This repository contains the code for HollaCaller, a self-hosted video conferencing app.
It is split into two parts: Backend and Frontend.

## Structure

- `backend/` -> Contains the Node.js Signaling Server.
- `frontend/` -> Contains the Static HTML Application.

## How to Deploy on Coolify

You will need to create **two** separate resources in Coolify from this single repository.

### 1. Deploy Backend (Signaling Server)
- Create a new **Application** resource.
- Select this GitHub repository.
- **Build Pack:** Node.js / Dockerfile
- **Base Directory / Build Context:** `/backend`
- **Port:** 9000
- **Domain:** Set a domain (e.g., `https://signal.yourdomain.com`)

### 2. Deploy Frontend (The App)
- Create a new **Static Site** resource.
- Select this GitHub repository.
- **Base Directory / Build Context:** `/frontend`
- **Domain:** Set a domain (e.g., `https://meet.yourdomain.com`)

### 3. Connect Them
- Open your deployed Frontend URL.
- Click "Server Settings" at the bottom.
- Enter the **Host** of your Backend (e.g., `signal.yourdomain.com`) without `https://`.
- Save and refresh.
