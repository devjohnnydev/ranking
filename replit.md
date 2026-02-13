# EduGame

## Overview
EduGame is a gamified education platform built with React (Vite) frontend and Express.js backend. It supports multiple user roles (Super Admin, Teacher, Student) with class management, activities, grading, rankings, and messaging.

## Project Architecture
- **Frontend**: React 19 with Vite, served on port 5000 (dev)
- **Backend**: Express.js API server on port 3001
- **Database**: PostgreSQL via Prisma ORM
- **Styling**: CSS with Framer Motion animations

### Directory Structure
- `src/` - React frontend source
- `server/` - Express backend
- `server/prisma/` - Prisma schema and migrations
- `public/` - Static assets

### Key Files
- `vite.config.js` - Vite config (proxies /api to backend)
- `server/index.js` - Express API server
- `server/prisma/schema.prisma` - Database schema

## Development
- Frontend runs on port 5000 (Vite dev server)
- Backend runs on port 3001 (Express)
- Vite proxies `/api` requests to the backend

## Database
- PostgreSQL (Replit managed)
- Models: User, Class, Enrollment, Activity, Grade, Message
- Prisma ORM for database access

## Deployment
- Build: Prisma generate + Vite build
- Production: Express serves built frontend from `dist/` and handles API routes
