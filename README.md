# Kongunadu College of Engineering & Technology - Admission Portal

A full-stack admissions portal built with **FastAPI** (Backend) and **React/Vite** (Frontend).

## Deployment Guide

### 1. Backend Deployment (Dokploy)
The backend is designed to be easily deployed using Docker Compose via Dokploy.

1. Connect your GitHub repository to Dokploy.
2. In the **Environment** tab, you MUST provide the following exactly:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=kongu
POSTGRES_URL=postgresql://postgres:your_secure_password@db:5432/kongu
SECRET_KEY=your_secure_random_hash
FRONTEND_URL=https://your-vercel-frontend-url.vercel.app
```
*(Make sure `FRONTEND_URL` has NO trailing slash!)*
3. Click **Deploy**. Dokploy will automatically spin up the Postgres database and the FastAPI backend.

### 2. Frontend Deployment (Vercel)
The frontend is built with React and Vite, optimized for Vercel.

1. Connect the `frontend/` directory of your repository to Vercel.
2. In the Vercel **Environment Variables** settings, add:
```env
VITE_BACKEND_URL=https://your-dokploy-backend-domain.com
```
*(Make sure `VITE_BACKEND_URL` has NO trailing slash!)*
3. Click **Deploy**.

---

## Administration Tools

Because the database lives securely inside a Docker container, we have provided built-in scripts that you can run directly inside the Dokploy terminal.

### Creating an Admin User
To create a new faculty/admin user so they can log into the frontend, open the **Terminal** tab for your `Backend` container in Dokploy and run:

```bash
python create_admin.py --email admin@kncet.com --password my_secure_password
```

### Running Data Migrations
If you need to dump existing data (like CSVs from Google Sheets) into your live Postgres database, upload your CSV files to the container and run:

```bash
python dump_csv.py
```

## API Documentation
Once your backend is running, you can access the automatically generated interactive API documentation (Swagger UI) at:
- `https://your-dokploy-backend-domain.com/docs`
