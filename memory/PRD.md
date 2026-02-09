# Graand Prix - Swimming Pool Maintenance SaaS Platform

## Original Problem Statement
Cloud-based SaaS platform for swimming pool maintenance companies working on AMC (Annual Maintenance Contract) models. Multi-tenant system with Company Portal, Engineer Portal, and Customer Portal. Optional Sales CRM module for complete sales lifecycle management.

## Architecture
- **Backend**: FastAPI + MongoDB (motor async driver)
- **Frontend**: React 19 + TailwindCSS + Shadcn/UI
- **Authentication**: JWT-based with role-based access control
- **Database**: MongoDB with collections for users, companies, customers, pools, amc_plans, amc_assignments, services, service_logs, engineers, leads, quotations, work_orders, boq_items, deliveries, installations

## User Personas
1. **Company Admin**: Pool service company owner/manager
2. **Engineer/Technician**: Field service technician
3. **Customer**: End customer with pool AMC contract
4. **Sales Team**: (via CRM module) Manages leads and quotations

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

## What's Been Implemented

### Core AMC System (Feb 2026)
- Auth endpoints: register, login, me
- Company management with branding settings
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

### Sales CRM Module (Feb 2026) - OPTIONAL
**Can be enabled/disabled per company in Settings**

Backend:
- Leads management (create, update status, delete)
- Quotations with line items, tax, validity
- Quotation revisions and status workflow
- Work Orders from approved quotations
- BOQ (Bill of Quantity) management
- Delivery tracking
- Installation scheduling and tracking
- **AMC Conversion**: Convert completed work orders to AMC customers with auto-service generation

Frontend:
- CRM Dashboard with pipeline value and funnel stats
- Leads page with status tracking and filtering
- Quotations page with line item editor
- Work Orders page with status management
- AMC conversion modal

### Frontend Portals
- Admin Portal: Full dashboard, customers, pools, AMC plans, services, engineers, settings, CRM
- Engineer Portal: Mobile-first, today's jobs, GPS service execution
- Customer Portal: Service history, AMC tracking

## CRM Workflow
1. **Lead Capture** → Create lead with customer details, pool info, requirements
2. **Quotation** → Create quotation with line items from lead
3. **Approval** → Send → Approve/Reject quotation
4. **Work Order** → Create work order from approved quotation
5. **Execution** → BOQ → Deliveries → Installation
6. **AMC Conversion** → Convert completed work order to AMC customer

## Prioritized Backlog

### P0 (Critical - Done)
- [x] Auth system
- [x] Core CRUD operations
- [x] Service workflow with GPS
- [x] Multi-portal access
- [x] Sales CRM module

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
- CRM Enabled: Yes

## Next Tasks
1. Add cloud storage integration for proof photos
2. Implement PDF report generation
3. Build Super Admin portal
4. Add email notifications
5. Implement subscription management
