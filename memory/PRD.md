# Graand Prix - Swimming Pool Maintenance SaaS Platform

## Original Problem Statement
Cloud-based SaaS platform for swimming pool maintenance companies working on AMC (Annual Maintenance Contract) models. Multi-tenant system with Company Portal, Engineer Portal, and Customer Portal.

## Architecture
- **Backend**: FastAPI + MongoDB (motor async driver)
- **Frontend**: React 19 + TailwindCSS + Shadcn/UI
- **Authentication**: JWT-based with role-based access control
- **Database**: MongoDB with collections for users, companies, customers, pools, amc_plans, amc_assignments, services, service_logs, engineers

## User Personas
1. **Company Admin**: Pool service company owner/manager
2. **Engineer/Technician**: Field service technician
3. **Customer**: End customer with pool AMC contract

## Core Requirements (Static)
- [x] JWT Authentication with 3 roles
- [x] Company registration and management
- [x] Customer CRUD operations
- [x] Pool management per customer
- [x] AMC Plan creation with checklist
- [x] AMC assignment to pools with engineer
- [x] Auto-generation of scheduled services
- [x] Engineer service execution with GPS proof
- [x] Customer portal for transparency
- [x] Role-based access control
- [x] Data isolation per company

## What's Been Implemented (MVP - Feb 2026)

### Backend (FastAPI)
- Auth endpoints: register, login, me
- Company management
- Customer CRUD with auto customer user creation
- Pool management
- AMC Plan CRUD with checklist items
- AMC Assignment with auto service generation
- Engineer management with login credentials
- Service scheduling and assignment
- Engineer service execution (start/end with GPS)
- Service logs with time, location, checklist, readings
- Customer portal endpoints
- Dashboard statistics

### Frontend (React)
- Login/Register pages with beautiful pool background
- Admin Portal:
  - Dashboard with stats and today's services
  - Customers management with pools and AMC assignment
  - Pools overview
  - AMC Plans management with checklist
  - Services schedule with date navigation
  - Engineers management
  - Company settings
- Engineer Portal (Mobile-first):
  - Today's jobs dashboard
  - Start/End service with GPS capture
  - Service checklist and readings
  - Service history
  - Profile page
- Customer Portal (Mobile-first):
  - Dashboard with AMC overview
  - Service history with details
  - Pool listing

## Prioritized Backlog

### P0 (Critical - Done)
- [x] Auth system
- [x] Core CRUD operations
- [x] Service workflow with GPS
- [x] Multi-portal access

### P1 (High Priority - Next Phase)
- [ ] Cloud storage integration (Google Drive/OneDrive) for photos
- [ ] PDF report generation
- [ ] Email notifications
- [ ] Super Admin portal
- [ ] Subscription/billing management

### P2 (Medium Priority)
- [ ] WhatsApp notifications
- [ ] Advanced analytics dashboard
- [ ] Engineer performance reports
- [ ] AMC compliance reports
- [ ] Bulk service scheduling
- [ ] Calendar view for services

### P3 (Nice to Have)
- [ ] Mobile app (React Native)
- [ ] Offline mode for engineers
- [ ] Customer feedback system
- [ ] Inventory management
- [ ] Invoice generation

## Test Credentials
- Admin: admin@graandprix.com / admin123
- Company: Graand Prix Pool Services

## Next Tasks
1. Add cloud storage integration for proof photos
2. Implement PDF report generation
3. Build Super Admin portal
4. Add email notifications
5. Implement subscription management
